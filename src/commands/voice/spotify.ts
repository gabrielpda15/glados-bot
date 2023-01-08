import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData } from '@app/library/discord/discord-voice';
import { createEmbed } from '@app/library/utils';
import { RadioService } from '@app/library/voice/radio.service';
import { hostAudioService } from '@app/main';
import { PermissionsString } from 'discord.js';

@Command()
export class Spotify implements DiscordCommand {

    public name: string = 'Spotify';
    public description: string = 'Faz eu entrar em um chat de voz para tocar Spotify!';
    public aliases: string[] = [ 'spotify' ];
    public usage: string[] = [ '' ];
    public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
    public permission: PermissionsString = null;
    public onlyOwner: boolean = true;
    public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
    public requiredArgs: number = 0;
    public args: DiscordCommand.Argument[] = [];

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

        let voice: DiscordVoiceData = null;       

        try {
            voice = await e.getVoiceData(true);
            if (!voice.ensureType('host_audio')) throw 'Desculpe, mas já estou tocando outra coisa no momento!';
        } catch (err: any) {
            await e.reply(err);
            return;
        }

        await voice.playHostAudio();

        const embed = createEmbed('🎶 Tocando Spotify');

        await e.reply([embed.data], false);
    }

}