import { discordBot, hostAudioService, radioService, spotifyService, youtubeService } from '@app/main';
import { AudioPlayer, AudioResource, createAudioPlayer, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import { APIEmbed, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import { SpotifyPlaylist, SpotifyTrack } from '../spotify/spotify.service';
import { createEmbed, log } from '../utils';
import { YoutubePlaylist, YoutubeVideo, YoutubeError, isYoutubeError } from '../youtube/youtube-service';

export class VoiceTrack {
	public title: string;
	public length: number;
	public url: string;
	public type: 'youtube' | 'spotify';
	public requestedBy?: Snowflake;
	public artist: string;

	public static fromYoutubeVideo(video: YoutubeVideo, requestedBy: Snowflake): VoiceTrack {
		const instance = new VoiceTrack();
		instance.title = video.title;
		instance.length = video.length;
		instance.url = video.url;
		instance.artist = video.channel.name;
		instance.type = 'youtube';
		instance.requestedBy = requestedBy;
		return instance;
	}

	public static fromSpotifyTrack(track: SpotifyTrack, requestedBy: Snowflake): VoiceTrack {
		const instance = new VoiceTrack();
		instance.title = track.title;
		instance.length = track.length;
		instance.url = track.url;
		instance.artist = track.artist.name;
		instance.type = 'spotify';
		instance.requestedBy = requestedBy;
		return instance;
	}

	public async toEmbed(title: string): Promise<APIEmbed> {
		let embed = createEmbed(title, this.toString());

		if (this.requestedBy) {
			const user = await discordBot.users.fetch(this.requestedBy);
			embed = embed.setFooter({
				text: `Pedida por ${user.tag}`,
				iconURL: user.avatarURL({ forceStatic: true }),
			});
		}

		return embed.data;
	}

	public toString(): string {
		const min = Math.floor(this.length / 60);
		const sec = this.length - min * 60;
		const time = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
		const title = this.type === 'youtube' ? this.title : this.artist + ' - ' + this.title;
		return `[${title}](${this.url}) \`${time}\``;
	}

	public equals(track: VoiceTrack) {
		return (
			this.title === track.title &&
			this.length === track.length &&
			this.url === track.url &&
			this.type === track.type &&
			this.artist === track.artist
		);
	}

	public equivalent(track: VoiceTrack) {
		const normalize = (value: string) => value.normalize().trim().toLowerCase();
		const compare = (a: string, b: string) => normalize(a) === normalize(b);
		return compare(track.url, this.url) || (compare(track.title, this.title) && compare(track.artist, this.artist));
	}
}

export class VoicePlaylist {
	public items: VoiceTrack[];
	public requestedBy?: Snowflake;

	public static fromYoutubePlaylist(playlist: YoutubePlaylist, requestedBy: Snowflake): VoicePlaylist {
		const instance = new VoicePlaylist();
		instance.items = playlist.items.map((x) => VoiceTrack.fromYoutubeVideo(x, requestedBy));
		instance.requestedBy = requestedBy;
		return instance;
	}

	public static fromSpotifyPlaylist(playlist: SpotifyPlaylist, requestedBy: Snowflake): VoicePlaylist {
		const instance = new VoicePlaylist();
		instance.items = playlist.items.map((x) => VoiceTrack.fromSpotifyTrack(x, requestedBy));
		instance.requestedBy = requestedBy;
		return instance;
	}

	public async toEmbed(title: string): Promise<APIEmbed> {
		let embed = createEmbed(title, `Adicionado(s) \`${this.items.length}\` vídeos para a fila!`);

		if (this.requestedBy) {
			const user = await discordBot.users.fetch(this.requestedBy);
			embed = embed.setFooter({
				text: `Pedido por ${user.tag}`,
				iconURL: user.avatarURL({ forceStatic: true }),
			});
		}

		return embed.data;
	}
}

export type VoiceQueueLoopType = 'all' | 'one' | 'none';
export type VoiceDataType = 'none' | 'youtube' | 'radio' | 'host_audio' | 'spotify';

export class VoiceQueue extends Array<VoiceTrack> {}

const quotaExceededCountTimeout: { [key: number]: { time: number, message: string } } = {
	1: {
		time: 5000,
		message: '5 segundos'
	},
	2: {
		time: 60000,
		message: '1 minuto'
	},
	3: {
		time: 180000,
		message: '3 minutos'
	},
	4: {
		time: 600000,
		message: '10 minutos'
	},
}

export class DiscordVoiceData {
	private type: VoiceDataType;
	private quotaExceededCount: number;

	public readonly connection: VoiceConnection;
	public readonly player: AudioPlayer;
	public readonly voiceChannel: VoiceChannel;
	public readonly textChannel: TextChannel | VoiceChannel;
	public isPlaying: boolean;
	public volume: number;
	public queue: VoiceQueue;
	public loop: VoiceQueueLoopType;

	constructor(voiceChannel: VoiceChannel, textChannel: TextChannel | VoiceChannel) {
		this.voiceChannel = voiceChannel;
		this.textChannel = textChannel;
		this.connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guildId,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
			selfDeaf: true,
			selfMute: false,
		});
		this.player = createAudioPlayer();
		this.isPlaying = false;
		this.type = 'none';
		this.volume = 100;
		this.queue = new VoiceQueue();
		this.loop = 'none';
	}

	public getType(): VoiceDataType {
		return this.type;
	}

	public ensureType(type: VoiceDataType): boolean {
		if (type === 'none') return false;
		if (this.type === type) return true;
		if (this.type === 'none') {
			this.type = type;
			return true;
		}

		return false;
	}

	public async dispose(): Promise<void> {
		if (this.type == 'host_audio') {
			await hostAudioService.disposeStream();
		}
	}

	public async playRadio(radio: string): Promise<void> {
		try {
			if (this.type !== 'radio') throw 'The current discord voice is not set to be radio type';

			if (!this.isPlaying) this.isPlaying = true;

			const stream = await radioService.getStream(<any>radio, this.volume);
			if (!stream) throw 'Radio stream returned null';
			this.player.play(stream);
		} catch (err) {
			log('Something went wrong trying to play the radio!', 'Discord', 'err');
			if (err) log(<any>err, 'Discord', 'err');
			await this.textChannel.send('Deu algo errado ao tentar reproduzir a sua radio!');
		}
	}

	public async playHostAudio(): Promise<void> {
		try {
			if (this.type !== 'host_audio') throw 'The current discord voice is not set to be host_audio type';
			if (this.isPlaying) throw "I'm already playing the host audio!";
			this.isPlaying = true;

			const stream = hostAudioService.getStream();
			if (!stream) throw 'Host audio stream returned null';
			this.player.play(stream);
		} catch (err) {
			log('Something went wrong trying to play the host audio!', 'Discord', 'err');
			if (err) log(<any>err, 'Discord', 'err');
			await this.textChannel.send('Deu algo errado ao tentar reproduzir a música local!');
		}
	}

	public async playNext(shouldShift: boolean = true): Promise<void> {
		try {
			if (this.type !== 'youtube') throw 'The current discord voice is not set to be youtube type';

			if (this.queue.length == 0) {
				if (this.isPlaying) this.connection.disconnect();
				return;
			} else {
				if (this.isPlaying) {
					if (this.loop == 'none' && shouldShift) this.queue.shift();
					else if (this.loop == 'all' && shouldShift) this.queue.push(this.queue.shift());

					if (this.queue.length == 0) {
						this.connection.disconnect();
						return;
					}
				} else {
					this.isPlaying = true;
				}

				const track = this.queue[0];

				const streamByType: { [key: string]: () => Promise<AudioResource> } = {
					youtube: () => youtubeService.getStream(track, this.volume),
					spotify: () => spotifyService.getStream(track, this.volume),
				};

				const stream = await streamByType[track.type]();
				if (!stream) throw 'Null stream returned from song';
				this.player.play(stream);
				this.quotaExceededCount = 0;
			}
		} catch (err: any) {
			if (isYoutubeError(err)) {
				const ytError: YoutubeError = err;
				if (ytError.errors.some((error) => error.reason === 'quotaExceeded')) {
					const timeout = quotaExceededCountTimeout[++this.quotaExceededCount];
					if (!timeout) {
						log(ytError.message, 'Youtube', 'err');
						await this.textChannel.send(
							'Opa! Parace que o Youtube não quer ser mais nosso amigo :sob:'
						);
						this.connection.disconnect();
						return;
					}

					log(ytError.message, 'Youtube', 'err');
					await this.textChannel.send(
						`Opa! Parece que o YouTube ficou de mau com a gente :cry:\nVamos aguardar ${timeout.message} para ele voltar ser nosso amigo!`
					);

					setTimeout(async () => {
						await this.playNext(false);
					}, timeout.time);
				}
			}

			log('Something went wrong trying to play the next song!', 'Discord', 'err');
			if (err) log(<any>err, 'Discord', 'err');
			await this.textChannel.send('Deu algo errado ao tentar reproduzir a próxima música!');
			await this.playNext();
		}
	}
}
