import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { PermissionsString } from 'discord.js';
import { ConfigSet } from './config-set';

@Command({
	subcommands: [ConfigSet],
})
export class Config implements DiscordCommand {
	public name: string = 'Configuração';
	public description: string = 'Comando base de configuração das minhas variaveis!';
	public aliases: string[] = ['config'];
	public parentAlias?: string = 'get';
	public usage: string[] = ['', '<set|check>'];
	public category: DiscordCommand.Category = DiscordCommand.Category.ADMINISTRATIVE;
	public permission: PermissionsString = 'ManageGuild';
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
	public requiredArgs: number = 0;
	public args: DiscordCommand.Argument[] = [];

	public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
		console.log('Only Config!');
	}
}
