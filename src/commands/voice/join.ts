import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { PermissionResolvable, VoiceChannel } from 'discord.js';

@Command()
export class Join implements DiscordCommand {

    public name: string = 'Join';
    public description: string = 'Faz eu entrar em um chat de voz!';
    public aliases: string[] = [ 'join' ];
    public usage: string[] = [ '' ];
    public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
    public permission: PermissionResolvable = null;
    public onlyOwner: boolean = false;
    public requiredArgs: number = 0;

    public async execute(e: DiscordCommand.ExecuteArgs): Promise<any> {
        if (!e.message.member.voice.channel) {
            return;
        }

        if (!e.message.member.voice.channel.joinable) {
            return;
        }

        const channel = <VoiceChannel>e.message.member.voice.channel;
        const voice = await e.getVoiceData(channel);
    }

}