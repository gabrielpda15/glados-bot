import { ClientEvents } from 'discord.js';

export interface DiscordEvent<K extends keyof ClientEvents> {

    execute(...args: ClientEvents[K]): Promise<any>;

}