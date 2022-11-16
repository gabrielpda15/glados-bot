import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData } from '@app/library/discord/discord-voice';
import { PermissionsString } from 'discord.js';

@Command()
export class Skip implements DiscordCommand {

    public name: string = 'Skip';
    public description: string = 'Pula a música que está tocando atuamente!';
    public aliases: string[] = [ 'skip', 's' ];
    public usage: string[] = [ '' ];
    public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
    public permission: PermissionsString = null;
    public onlyOwner: boolean = false;
    public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
    public requiredArgs: number = 0;
    public args: DiscordCommand.Argument[] = [];

    public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
        const channel = await e.getMemberVoiceChannel();
        
        if (!channel) {
            await e.reply('Desculpe, mas você não está em um canal de voz!');
            return;
        }

        let voice: DiscordVoiceData = null;

        try {
            voice = await e.getVoiceData();
        } catch (err: any) {
            await e.reply(err);
            return;
        }

        await voice.playNext();

        if (e.isMessage()) await e.react('✅');
        else if (e.isInteraction()) await e.reply('Pulando música atual!', false);        
    }

}