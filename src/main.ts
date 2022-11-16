import 'reflect-metadata';
import { config, log } from './library/utils';
import { DiscordBot } from './library/discord/discord-bot';
import { DatabaseService } from './library/typeorm/database-service';
import { YoutubeService } from './library/youtube/youtube-service';

export const args = config();

export const databaseService = DatabaseService.create();
export const youtubeService = YoutubeService.create();
export const discordBot = DiscordBot.create();

const startTime = new Date();
(async () => { 
    await databaseService.initialize();
    await youtubeService.initialize('youtube.com_cookies.txt');
    await discordBot.initialize();

    await discordBot.connect();
})()
.catch(err => console.error(err))
.then(() => log(`Done! ${(new Date().getTime() - startTime.getTime())}ms`, 'System', 'info'));