import { youtubeService } from '@app/main';
import { AudioResource, createAudioResource, StreamType } from '@discordjs/voice';
import { VoiceTrack } from '../discord/discord-voice';
import { SpotifyApiHandler } from './spotify-api-handler';
import { SpotifyAuthHandler } from './spotify-auth-handler';

const spotifyUrl = /(https?:\/\/)?open.spotify.com\/(track|playlist)\/([^?]+)/;

export enum SpotifyUrlType {
	Unknown = 0,
	Track = 1 << 0,
	Playlist = 1 << 1,
}

export interface SpotifyTrack {
	id: string;
	title: string;
	length: number;
	url: string;
	artist: { name: string; url: string };
}

export interface SpotifyPlaylist {
	id: string;
	title: string;
	length: number;
	url: string;
	items: SpotifyTrack[];
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

	public async getStream(track: VoiceTrack, volume: number = 100): Promise<AudioResource> {
		const search = track.title + ' - ' + track.artist;
		const videoResult = await youtubeService.searchVideo(search, 1);
		const videoId = videoResult.items[0].id;
		const youtubeTrack = new VoiceTrack();
		youtubeTrack.url = `https://www.youtube.com/watch?v=${videoResult.items[0].id}`;
		return await youtubeService.getStream(youtubeTrack, volume);
	}
}
