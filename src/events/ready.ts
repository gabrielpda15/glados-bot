import { DiscordBot } from '@app/library/discord/discord-bot';
import { DiscordCommand } from '@app/library/discord/discord-command';
import { Event } from '@app/library/discord/discord-decorators';
import { DiscordEvent } from '@app/library/discord/discord-event';
import { startActivityLoop } from '@app/library/utils';
import { Client, ApplicationCommandType, ApplicationCommandOptionType, ApplicationCommandDataResolvable, ApplicationCommandOptionData, ApplicationCommandSubCommandData, ApplicationCommandSubGroupData } from 'discord.js';

@Event('ready')
export class OnReadyEvent implements DiscordEvent<'ready'> {
	public async execute(client: Client<true>): Promise<any> {
		const bot = <DiscordBot>client;
		await startActivityLoop(bot, null);

		// TODO: Add subcommand support as well
		const commands = bot.commands.values().reduce((acc, command) => {
			// const subcommands: any[] = command.hasSubcommands 
			// 	? command.subcommands.map((subcommand) => ({ 
			// 		name: subcommand.aliases[0],
			// 		description: subcommand.description,
			// 		type: ApplicationCommandOptionType.Subcommand,
			// 		options: subcommand.args.map((arg) => arg.getOptions())
			// 		})) 
			// 	: [];
			const mainCommandOptions =  command.main.args.map((arg) => arg.getOptions());
			const mainCommand: ApplicationCommandDataResolvable = {
				name: command.main.aliases[0],
				description: command.main.description,
				type: ApplicationCommandType.ChatInput,
				options: [ ...mainCommandOptions, /*...subcommands*/ ],
				dm_permission: false,
				nsfw: command.main.nsfw
			}
			return [...acc, mainCommand];
		}, [] as ApplicationCommandDataResolvable[])
		
		await bot.application.commands.set(commands);

		for (const guild of bot.guilds.cache.map((g) => g)) {
			await bot.reloadSlashCommands(guild);
		}
	}
}
