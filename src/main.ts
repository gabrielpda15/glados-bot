import 'reflect-metadata';
import { config } from 'dotenv';
import { log } from './library/utils';
import { DiscordBot } from './library/discord/discord-bot';

config({ path: '.env' });

const startTime = new Date();
(async () => { 
    const bot = DiscordBot.create();
    await bot.initialize();
    await bot.connect();
})()
.catch(err => console.error(err))
.then(() => log(`Done! ${(new Date().getTime() - startTime.getTime())}ms`, 'System', 'info'));