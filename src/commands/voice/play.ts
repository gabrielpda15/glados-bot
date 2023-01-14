import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData, VoicePlaylist, VoiceTrack } from '@app/library/discord/discord-voice';
import { SpotifyUrlType } from '@app/library/spotify/spotify.service';
import { containsUrl, createEmbed, isValidUrl, log } from '@app/library/utils';
import { YoutubeUrlType } from '@app/library/youtube/youtube-service';
import { spotifyService, youtubeService } from '@app/main';
import { APIEmbed, PermissionsString } from 'discord.js';

type PlayFuncResult = {
	embed?: APIEmbed;
	tracks?: VoiceTrack[];
	error?: string;
};

@Command()
export class Play implements DiscordCommand {
	public name: string = 'Play';
	public description: string = 'Faz eu entrar em um chat de voz e trocar uma musica!';
	public aliases: string[] = ['play', 'p'];
	public usage: string[] = ['<nome|url>'];
	public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
	public permission: PermissionsString = null;
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.YES;
	public requiredArgs: number = 1;
	public args: DiscordCommand.Argument[] = [
		new DiscordCommand.Argument('String', 'musica', 'Nome ou url do video do Youtube', true),
	];

	public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
		const channel = await e.getMemberVoiceChannel();

		if (!channel) {
			await e.reply('Desculpe, mas você não está em um canal de voz!');
			return;
		}

		if (!channel.joinable) {
			await e.reply('Desculpe, mas não consigo entrar no mesmo canal de voz que você!');
			return;
		}

		const youtubeType = youtubeService.validateUrl(e.args[0]);
		const spotifyType = spotifyService.validateUrl(e.args[0]);

		const spotifyTypeToFunc = {
			[SpotifyUrlType.Track]: async () => await this.playSpotifyTrack(e.args[0], e.input.member.user.id),
			[SpotifyUrlType.Playlist]: async () => await this.playSpotifyPlaylist(e.args[0], e.input.member.user.id),
			[SpotifyUrlType.Unknown]: async () => await this.playFromSearch(e.args.join(' '), e.input.member.user.id),
		};

		const youtubeTypeToFunc = {
			[YoutubeUrlType.Both]: async () => await this.playYoutubeVideo(e.args[0], e.input.member.user.id),
			[YoutubeUrlType.Video]: async () => await this.playYoutubeVideo(e.args[0], e.input.member.user.id),
			[YoutubeUrlType.Playlist]: async () => await this.playYoutubePlaylist(e.args[0], e.input.member.user.id),
			[YoutubeUrlType.Unknown]: async () => spotifyTypeToFunc[spotifyType](),
		};

		const funcResult = await youtubeTypeToFunc[youtubeType]();

		if (funcResult.error) {
			await e.reply(funcResult.error);
			return;
		}

		const tracks: VoiceTrack[] = funcResult.tracks;
		const embed: APIEmbed = funcResult.embed;

		let voice: DiscordVoiceData = null;

		try {
			voice = await e.getVoiceData(true);
			if (!voice.ensureType('youtube')) throw 'Desculpe, mas já estou tocando outra coisa no momento!';
		} catch (err: any) {
			await e.reply(err);
			return;
		}

		voice.queue.push(...tracks);
		if (!voice.isPlaying) await voice.playNext();

		await e.reply([embed], false);
	}

	private async playFromSearch(arg: string, user: string): Promise<PlayFuncResult> {
		try {
			const videoResult = await youtubeService.searchVideo(arg, 1);
			const videoInfo = await youtubeService.getVideoInfo(
				`https://www.youtube.com/watch?v=${videoResult.items[0].id}`
			);
			if (!videoInfo) {
				return {
					error: 'Ocorreu um erro ao tentar acessar essa música, ela pode possuir alguma restrição de região ou idade!',
				};
			}

			const track = VoiceTrack.fromYoutubeVideo(videoInfo);
			track.requestedBy = user;

			return {
				embed: await track.toEmbed('🎶 Música Adicionada'),
				tracks: [track],
			};
		} catch (err) {
			log(err, 'Discord', 'err');
			return {
				error: 'Ocorreu um erro ao procurar por essa música! Verifique a busca e tente novamente!',
			};
		}
	}

	private async playYoutubeVideo(arg: string, user: string): Promise<PlayFuncResult> {
		try {
			const videoInfo = await youtubeService.getVideoInfo(arg);
			if (!videoInfo) {
				return {
					error: 'Ocorreu um erro ao tentar acessar essa música, ela pode possuir alguma restrição de região ou idade!',
				};
			}

			const track = VoiceTrack.fromYoutubeVideo(videoInfo);
			track.requestedBy = user;

			return {
				embed: await track.toEmbed('🎶 Música Adicionada'),
				tracks: [track],
			};
		} catch (err) {
			log(err, 'Discord', 'err');
			return {
				error: 'Ocorreu um erro ao procurar por essa música! Verifique a busca e tente novamente!',
			};
		}
	}

	private async playYoutubePlaylist(arg: string, user: string): Promise<PlayFuncResult> {
		const playlistInfo = await youtubeService.getPlaylistInfo(arg, Number.POSITIVE_INFINITY);
		if (!playlistInfo) {
			return {
				error: 'Ocorreu um erro ao tentar acessar essa playlist, ela pode possuir alguma restrição de região, idade ou privacidade!',
			};
		}

		const playlist = VoicePlaylist.fromYoutubePlaylist(playlistInfo);
		playlist.requestedBy = user;

		return {
			embed: await playlist.toEmbed('🎶 Playlist Adicionada'),
			tracks: playlist.items.map((video) => {
				const temp = VoiceTrack.fromYoutubeVideo(video);
				temp.requestedBy = user;
				return temp;
			}),
		};
	}

	private async playSpotifyTrack(arg: string, user: string): Promise<PlayFuncResult> {
		const auth = await spotifyService.auth.getAuthorization();
		const id = spotifyService.getIdFromUrl(arg);
		const result = await spotifyService.api.getTrack({ trackId: id, authorization: auth });

		if (!result) {
			return { error: 'Não consigui encontrar essa música no Spotify!' };
		}

		const artist = result['artists']?.[0]?.['name'];
		const track = result['name'];

		if (!artist || !track) {
			return { error: 'Desculpe, mas tem algo errado com essa música!' };
		}

		const youtubeSearch = artist + ' - ' + track;

		return await this.playFromSearch(youtubeSearch, user);
	}

	private async playSpotifyPlaylist(arg: string, user: string): Promise<PlayFuncResult> {
		return { error: 'Playlists do Spotify ainda não é suportado!' };
	}
}
