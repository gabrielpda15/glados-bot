import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { PermissionResolvable } from 'discord.js';

@Command()
export class Ping implements DiscordCommand {

    public name: string = 'Ping';
    public description: string = 'Pong!';
    public aliases: string[] = [ 'ping' ];
    public usage: string[] = [ '' ];
    public category: DiscordCommand.Category = DiscordCommand.Category.INFORMATIVE;
    public permission: PermissionResolvable = null;
    public onlyOwner: boolean = false;
    public requiredArgs: number = 0;

    public async execute(e: DiscordCommand.ExecuteArgs): Promise<any> {
        let botMsg = await e.send('〽️ Pinging...');
        let ping = botMsg.createdTimestamp - e.message.createdTimestamp + ' ms';
		await botMsg.edit(`:ping_pong: Pong! \`${ping}\``);
    }

}