import { DiscordBot } from '@app/library/discord/discord-bot';
import { Event } from '@app/library/discord/discord-decorators';
import { DiscordEvent } from '@app/library/discord/discord-event';
import { log } from '@app/library/utils';
import { Guild } from 'discord.js';

@Event('guildCreate')
export class OnGuildCreate implements DiscordEvent<'guildCreate'> {

    public async execute(guild: Guild): Promise<any> {
        const bot = <DiscordBot>guild.client;        
        await bot.reloadSlashCommands(guild);
    }    

}