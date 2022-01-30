import { ClientOptions } from 'discord.js';

export interface DiscordOptions extends ClientOptions {

    token: string;
    connectionName?: string;
    
}