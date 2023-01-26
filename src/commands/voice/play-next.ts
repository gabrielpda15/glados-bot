import { APIEmbed, PermissionsString } from 'discord.js';
import { spotifyService, youtubeService } from '@app/main';
import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData, VoicePlaylist, VoiceTrack } from '@app/library/discord/discord-voice';
import { SpotifyUrlType } from '@app/library/spotify/spotify.service';
import { YoutubeUrlType } from '@app/library/youtube/youtube-service';
import { log } from '@app/library/utils';
import { DiscordBot } from '@app/library/discord/discord-bot';
import { Play } from './play';

type PlayFuncResult = {
	embed?: APIEmbed;
	tracks?: VoiceTrack[];
	error?: string;
};

@Command()
export class PlayNext extends Play {
	public name: string = 'Play Next';
	public description: string = 'Faz eu entrar em um chat de voz e trocar uma musica!';
	public aliases: string[] = ['playnext', 'pn'];
	public usage: string[] = ['<nome|url>'];
	public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
	public permission: PermissionsString = null;
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.YES;
	public requiredArgs: number = 1;
	public args: DiscordCommand.Argument[] = [
		new DiscordCommand.Argument('String', 'musica', 'Nome ou url do video do Youtube', true),
	];

    protected async playAndReply(result: PlayFuncResult, e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<void> {
		let voice: DiscordVoiceData = null;

		try {
			voice = await e.getVoiceData(true);
			if (!voice.ensureType('youtube')) throw 'Desculpe, mas já estou tocando outra coisa no momento!';
		} catch (err: any) {
			await e.reply(err);
			return;
		}

        voice.queue.splice(1, 0, ...result.tracks);
		if (!voice.isPlaying) await voice.playNext();

		await e.reply([result.embed], false);
	}
}
