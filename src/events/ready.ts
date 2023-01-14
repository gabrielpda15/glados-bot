import { DiscordBot } from '@app/library/discord/discord-bot';
import { Event } from '@app/library/discord/discord-decorators';
import { DiscordEvent } from '@app/library/discord/discord-event';
import { startActivityLoop } from '@app/library/utils';
import { Client } from 'discord.js';

@Event('ready')
export class OnReadyEvent implements DiscordEvent<'ready'> {
	public async execute(client: Client<true>): Promise<any> {
		const bot = <DiscordBot>client;
		await startActivityLoop(bot, null);

		for (const guild of bot.guilds.cache.map((g) => g)) {
			await bot.reloadSlashCommands(guild);
		}
	}
}
