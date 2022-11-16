import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData } from '@app/library/discord/discord-voice';
import { PermissionsString, SlashCommandStringOption } from 'discord.js';

@Command()
export class Loop implements DiscordCommand {

    public name: string = 'Loop';
    public description: string = 'Faz eu sair em um chat de voz!';
    public aliases: string[] = [ 'loop', 'repeat', 'loopqueue', 'repetir' ];
    public usage: string[] = [ '<all|one|none>' ];
    public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
    public permission: PermissionsString = null;
    public onlyOwner: boolean = false;
    public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
    public requiredArgs: number = 1;
    public args: DiscordCommand.Argument[] = [
        new DiscordCommand.Argument(
            'String', 
            'valor', 
            'Escolha entre todas, apenas uma ou nenhum loop',
            true, true,
            [ 'all', 'one', 'none' ]
        )
    ];

    public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
        const channel = await e.getMemberVoiceChannel();

        if (!channel) {
            await e.reply('Desculpe, mas você não está em um canal de voz!');
            return;
        }

        if (!['all', 'one', 'none'].includes(e.args[0])) {
            await e.reply('Desculpe, mas as unicas opções disponíveis são: `all`, `one` ou `none`');
            return;
        }

        let voice: DiscordVoiceData = null;

        try {
            voice = await e.getVoiceData();
        } catch (err: any) {
            await e.reply(err);
            return;
        }

        voice.loop = <any>e.args[0];

        if (e.isMessage()) await e.react('✅');
        else if (e.isInteraction()) await e.reply(`A repetição foi definida para: \`${e.args[0]}\``, false);
    }

}