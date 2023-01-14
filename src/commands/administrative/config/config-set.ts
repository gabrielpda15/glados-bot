import { DiscordCommand } from '@app/library/discord/discord-command';
import { PermissionsString } from 'discord.js';

export class ConfigSet implements DiscordCommand {
	public name: string = 'Definir configuração';
	public description: string = 'Define o valor de uma de minhas variaveis!';
	public aliases: string[] = ['set'];
	public usage: string[] = ['<chave> <valor>'];
	public category: DiscordCommand.Category = DiscordCommand.Category.ADMINISTRATIVE;
	public permission: PermissionsString = 'ManageGuild';
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
	public requiredArgs: number = 2;
	public args: DiscordCommand.Argument[] = [
		new DiscordCommand.Argument('String', 'chave', 'A chave da configuração', true),
		new DiscordCommand.Argument('String', 'valor', 'O valor da configuração', true),
	];

	public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
		console.log('Config Set!');
	}
}
