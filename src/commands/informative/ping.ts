import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { PermissionsString } from 'discord.js';

@Command()
export class Ping implements DiscordCommand {
	public name: string = 'Ping';
	public description: string = 'Pong!';
	public aliases: string[] = ['ping'];
	public usage: string[] = [''];
	public category: DiscordCommand.Category = DiscordCommand.Category.INFORMATIVE;
	public permission: PermissionsString = null;
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
	public requiredArgs: number = 0;
	public args: DiscordCommand.Argument[] = [];

	public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
		let botMsg = await e.reply('〽️ Pinging...');
		let ping = botMsg.createdTimestamp - e.input.createdTimestamp + ' ms';

		if (e.isMessage()) await botMsg.edit(`:ping_pong: Pong! \`${ping}\``);
		else if (e.isInteraction()) await e.reply(`:ping_pong: Pong! \`${ping}\``);
	}
}
