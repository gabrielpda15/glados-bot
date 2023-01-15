import { discordBot, hostAudioService, radioService, spotifyService, youtubeService } from '@app/main';
import { AudioPlayer, AudioResource, createAudioPlayer, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import { APIEmbed, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import { SpotifyPlaylist, SpotifyTrack } from '../spotify/spotify.service';
import { createEmbed, log } from '../utils';
import { YoutubePlaylist, YoutubeVideo } from '../youtube/youtube-service';

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
		return `[${this.title}](${this.url}) \`${time}\``;
	}
}

export class VoicePlaylist {
	public items: VoiceTrack[];
	public requestedBy?: Snowflake;

	public static fromYoutubePlaylist(playlist: YoutubePlaylist, requestedBy: Snowflake): VoicePlaylist {
		const instance = new VoicePlaylist();
		instance.items = playlist.items.map(x => VoiceTrack.fromYoutubeVideo(x, requestedBy));
		instance.requestedBy = requestedBy;
		return instance;
	}

	public static fromSpotifyPlaylist(playlist: SpotifyPlaylist, requestedBy: Snowflake): VoicePlaylist {
		const instance = new VoicePlaylist();
		instance.items = playlist.items.map(x => VoiceTrack.fromSpotifyTrack(x, requestedBy));
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

export type VoiceQueue = VoiceTrack[];
export type VoiceQueueLoopType = 'all' | 'one' | 'none';
export type VoiceDataType = 'none' | 'youtube' | 'radio' | 'host_audio' | 'spotify';

export class DiscordVoiceData {
	private type: VoiceDataType;

	public readonly connection: VoiceConnection;
	public readonly player: AudioPlayer;
	public readonly voiceChannel: VoiceChannel;
	public readonly textChannel: TextChannel;
	public isPlaying: boolean;
	public volume: number;
	public queue: VoiceQueue;
	public loop: VoiceQueueLoopType;

	constructor(voiceChannel: VoiceChannel, textChannel: TextChannel) {
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
		this.queue = [];
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

	public async playNext(): Promise<void> {
		try {
			if (this.type !== 'youtube') throw 'The current discord voice is not set to be youtube type';

			if (this.queue.length == 0) {
				if (this.isPlaying) this.connection.disconnect();
				return;
			} else {
				if (this.isPlaying) {
					if (this.loop == 'none') this.queue.shift();
					else if (this.loop == 'all') this.queue.push(this.queue.shift());

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
			}
		} catch (err) {
			log('Something went wrong trying to play the next song!', 'Discord', 'err');
			if (err) log(<any>err, 'Discord', 'err');
			await this.textChannel.send('Deu algo errado ao tentar reproduzir a próxima música!');
		}
	}
}
