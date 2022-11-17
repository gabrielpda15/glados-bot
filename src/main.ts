import 'reflect-metadata';
import { config, log } from './library/utils';
import { DiscordBot } from './library/discord/discord-bot';
import { DatabaseService } from './library/typeorm/database-service';
import { YoutubeService } from './library/youtube/youtube-service';

export const args = config();

export var databaseService: DatabaseService;
export var youtubeService: YoutubeService;
export var discordBot: DiscordBot;

async function main(): Promise<any> {
    if (!args) return;

    databaseService = DatabaseService.create();
    youtubeService = YoutubeService.create();
    discordBot = DiscordBot.create();
    
    await databaseService.initialize();
    await youtubeService.initialize('youtube.com_cookies.txt');
    await discordBot.initialize();

    await discordBot.connect();
}

(async () => { 
    try {
        const startTime = new Date();
        await main();
        log(`Done! ${(new Date().getTime() - startTime.getTime())}ms`, 'System', 'succ');
    } catch (err: any) {
        log(err, 'System', 'err');
    }
})();