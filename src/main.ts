import 'reflect-metadata';
import { config, log } from './library/utils';
import { DiscordBot } from './library/discord/discord-bot';
import { DatabaseService } from './library/typeorm/database-service';
import { YoutubeService } from './library/youtube/youtube-service';
import { RadioService } from './library/voice/radio.service';
import { HostAudioService } from './library/voice/host-audio.service';
import { SpotifyService } from './library/spotify/spotify.service';
import { WebService } from './library/web/web.service';
import { existsSync as fsExist } from 'fs';
import { resolve as pathResolve } from 'path';

export const args = config();

export var databaseService: DatabaseService;
export var youtubeService: YoutubeService;
export var radioService: RadioService;
export var hostAudioService: HostAudioService;
export var spotifyService: SpotifyService;
export var discordBot: DiscordBot;
export var webService: WebService;

async function main(): Promise<any> {
	if (!args) return;

	databaseService = DatabaseService.create();
	youtubeService = YoutubeService.create();
	radioService = RadioService.create();
	hostAudioService = HostAudioService.create();
	spotifyService = SpotifyService.create();
	discordBot = DiscordBot.create();
	webService = WebService.create();

	await databaseService.initialize();
	await youtubeService.initialize('youtube.com_cookies.txt');
	await radioService.initialize();
	await hostAudioService.initialize();
	await spotifyService.initialize();
	await discordBot.initialize();
	await webService.initialize();

	webService.start();

	if (!fsExist(pathResolve(__dirname, '../.secrets'))) {
		await spotifyService.auth.login();
	} else {
		await spotifyService.auth.loginFromSecrets();
	}

	await discordBot.connect();
}

(async () => {
	try {
		const startTime = new Date();
		await main();
		log(`Done! ${new Date().getTime() - startTime.getTime()}ms`, 'System', 'succ');
	} catch (err: any) {
		log(err, 'System', 'err');
		if (err instanceof Error) {
			log(err.stack, 'System', 'trace');
		}		
	}
})();
