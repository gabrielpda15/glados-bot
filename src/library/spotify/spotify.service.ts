import { youtubeService } from '@app/main';
import { createAudioResource, StreamType } from '@discordjs/voice';
import { SpotifyApiHandler } from './spotify-api-handler';
import { SpotifyAuthHandler } from './spotify-auth-handler';

const spotifyUrl = /(https?:\/\/)?open.spotify.com\/(track|playlist)\/([^?]+)/;

export enum SpotifyUrlType {
	Unknown = 0,
	Track = 1 << 0,
	Playlist = 1 << 1,
}

export class SpotifyService {
	public readonly auth: SpotifyAuthHandler;
	public readonly api: SpotifyApiHandler;

	private constructor() {
		this.auth = new SpotifyAuthHandler();
		this.api = new SpotifyApiHandler();
	}

	public static create() {
		return new SpotifyService();
	}

	public async initialize(): Promise<void> {}

	public validateUrl(url: string): SpotifyUrlType {
		const match = url.match(spotifyUrl);

		if (!match) return SpotifyUrlType.Unknown;

		const typeFromMatch: { [key: string]: SpotifyUrlType } = {
			track: SpotifyUrlType.Track,
			playlist: SpotifyUrlType.Playlist,
		};

		return typeFromMatch[match[2]] ?? SpotifyUrlType.Unknown;
	}

	public getIdFromUrl(url: string): string {
		const match = url.match(spotifyUrl);
		if (!match) return;
		return match[3];
	}

	public async getStream() {
		// youtubeService.searchVideo()
	}
}
