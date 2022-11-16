import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData, VoicePlaylist, VoiceTrack } from '@app/library/discord/discord-voice';
import { createEmbed, isValidUrl } from '@app/library/utils';
import { YoutubeUrlType } from '@app/library/youtube/youtube-service';
import { youtubeService } from '@app/main';
import { APIEmbed, PermissionsString } from 'discord.js';

@Command()
export class Play implements DiscordCommand {

    public name: string = 'Play';
    public description: string = 'Faz eu entrar em um chat de voz e trocar uma musica!';
    public aliases: string[] = [ 'play', 'p' ];
    public usage: string[] = [ '<nome|url>' ];
    public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
    public permission: PermissionsString = null;
    public onlyOwner: boolean = false;
    public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.YES;
    public requiredArgs: number = 1;
    public args: DiscordCommand.Argument[] = [
        new DiscordCommand.Argument('String', 'musica', 'Nome ou url do video do Youtube', true)
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

        let tracks: VoiceTrack[] = [];
        let embed: APIEmbed = null;

        if (isValidUrl(e.args[0])) {
            const type = youtubeService.validateUrl(e.args[0]);

            if ((type & YoutubeUrlType.Video) === YoutubeUrlType.Video) {
                const videoInfo = await youtubeService.getVideoInfo(e.args[0]);
                if (videoInfo == null) {
                    await e.reply('Ocorreu um erro ao tentar acessar essa música, ela pode possuir alguma restrição de região ou idade!');
                    return;
                }

                const track = VoiceTrack.fromYoutubeVideo(videoInfo);
                track.requestedBy = e.input.member.user.id;

                embed = await track.toEmbed('🎶 Música Adicionada');
                tracks.push(track);
            } else if ((type & YoutubeUrlType.Playlist) === YoutubeUrlType.Playlist) {
                const playlistInfo = await youtubeService.getPlaylistInfo(e.args[0]);
                if (!playlistInfo) {
                    await e.reply('Ocorreu um erro ao tentar acessar essa playlist, ela pode possuir alguma restrição de região, idade ou privacidade!');
                    return;
                }

                const playlist = VoicePlaylist.fromYoutubePlaylist(playlistInfo);
                playlist.requestedBy = e.input.member.user.id;

                embed = await playlist.toEmbed('🎶 Playlist Adicionada');
                tracks.push(...playlist.items.map(video => {
                    const temp = VoiceTrack.fromYoutubeVideo(video);
                    temp.requestedBy = e.input.member.user.id;
                    return temp;
                }));
            } else {
                await e.reply('Desculpe, mas essa url não é valida!');
                return;
            }
        } else {
            await e.reply('Ainda não tenho suporte para pesquisas por nome, utilize uma URL no lugar!');
            return;
        }

        let voice: DiscordVoiceData = null;

        try {
            voice = await e.getVoiceData(true);
        } catch (err: any) {
            await e.reply(err);
            return;
        }

        voice.queue.push(...tracks);
        if (!voice.isPlaying) await voice.playNext();

        await e.reply([embed], false);
    }

}