import { APIEmbed, PermissionsString } from 'discord.js';
import { spotifyService, youtubeService } from '@app/main';
import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData, VoicePlaylist, VoiceTrack } from '@app/library/discord/discord-voice';
import { SpotifyUrlType } from '@app/library/spotify/spotify.service';
import { YoutubeUrlType } from '@app/library/youtube/youtube-service';
import { createEmbed, log } from '@app/library/utils';
import { DiscordBot } from '@app/library/discord/discord-bot';

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
		if (!this.validate(e)) return;

		const result = await this.getTrackFromArg(e.args, e.input.member.user.id, e.bot);

		if (result.error) {
			await e.reply(result.error);
			return;
		}

		await this.playAndReply(result, e);
	}

	protected async validate(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<boolean> {
		const channel = await e.getMemberVoiceChannel();

		if (!channel) {
			await e.reply('Desculpe, mas você não está em um canal de voz!');
			return false;
		}

		if (!channel.joinable) {
			await e.reply('Desculpe, mas não consigo entrar no mesmo canal de voz que você!');
			return false;
		}

		return true;
	}

	protected async getTrackFromArg(args: string[], user: string, bot: DiscordBot): Promise<PlayFuncResult> {
		const youtubeType = youtubeService.validateUrl(args[0]);
		const spotifyType = spotifyService.validateUrl(args[0]);

		const spotifyTypeToFunc = {
			[SpotifyUrlType.Track]: async () => await this.playSpotifyTrack(args[0], user),
			[SpotifyUrlType.Playlist]: async () =>
				await this.playSpotifyPlaylist(args[0], user, bot),
			[SpotifyUrlType.Unknown]: async () => await this.playFromSearch(args.join(' '), user),
		};

		const youtubeTypeToFunc = {
			[YoutubeUrlType.Both]: async () => await this.playYoutubeVideo(args[0], user),
			[YoutubeUrlType.Video]: async () => await this.playYoutubeVideo(args[0], user),
			[YoutubeUrlType.Playlist]: async () => await this.playYoutubePlaylist(args[0], user),
			[YoutubeUrlType.Unknown]: async () => spotifyTypeToFunc[spotifyType](),
		};

		return await youtubeTypeToFunc[youtubeType]();
	}

	protected async playAndReply(result: PlayFuncResult, e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<void> {
		let voice: DiscordVoiceData = null;

		try {
			voice = await e.getVoiceData(true);
			if (!voice.ensureType('youtube')) throw 'Desculpe, mas já estou tocando outra coisa no momento!';
		} catch (err: any) {
			await e.reply(err);
			return;
		}

		voice.queue.push(...result.tracks);
		if (!voice.isPlaying) await voice.playNext();

		await e.reply([result.embed], false);
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

			const track = VoiceTrack.fromYoutubeVideo(videoInfo, user);

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

			const track = VoiceTrack.fromYoutubeVideo(videoInfo, user);

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

		const playlist = VoicePlaylist.fromYoutubePlaylist(playlistInfo, user);

		return {
			embed: await playlist.toEmbed('🎶 Playlist Adicionada'),
			tracks: playlist.items,
		};
	}

	private async playSpotifyTrack(arg: string, user: string): Promise<PlayFuncResult> {
		const authorization = await spotifyService.auth.getAuthorization();
		const trackId = spotifyService.getIdFromUrl(arg);
		if (!trackId) {
			return { error: 'Não consigui encontrar essa música no Spotify!' };
		}

		const result = await spotifyService.api.getTrack({ trackId, authorization });

		if (!result) {
			return { error: 'Não consigui encontrar essa música no Spotify!' };
		}

		const youtubeSearch = result.artist.name + ' - ' + result.title;

		return await this.playFromSearch(youtubeSearch, user);
	}

	private async playSpotifyPlaylist(arg: string, user: string, bot: DiscordBot): Promise<PlayFuncResult> {
		const authorization = await spotifyService.auth.getAuthorization();
		const playlistId = spotifyService.getIdFromUrl(arg);
		if (!playlistId) {
			return { error: 'Não consigui encontrar essa playlist no Spotify!' };
		}

		const spotifyPlaylist = await spotifyService.api.getPlaylist({ playlistId, authorization });
		const playlist = VoicePlaylist.fromSpotifyPlaylist(spotifyPlaylist, user);

		return { 
			embed: await playlist.toEmbed('🎶 Playlist Adicionada'), 
			tracks: playlist.items
		};
	}
}
