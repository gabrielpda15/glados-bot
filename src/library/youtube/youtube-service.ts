import ytpl from 'ytpl';
import ytdl from 'ytdl-core';
import ytnode from 'youtube-node';
import { AudioResource, createAudioResource, StreamType } from '@discordjs/voice';
import { YoutubeCookie } from './youtube-cookie';
import { log } from '../utils';
import { VoiceTrack } from '../discord/discord-voice';

export interface YoutubeError {
	code: number;
	message: string;
	errors: {
		message: string;
		domain: string;
		reason: string;
	}[];
}

export function isYoutubeError(err: YoutubeError): boolean {
	return (
		typeof err.code === 'number' && 
		typeof err.message === 'string' && 
		typeof err.errors === 'object' && 
		Array.isArray(err.errors) && 
		err.errors.every((suberr) => 
				typeof suberr.message === 'string' &&
				typeof suberr.domain === 'string' &&
				typeof suberr.reason === 'string'
		)
	);
}

export interface YoutubeVideo {
	id: string;
	title: string;
	length: number;
	url: string;
	channel: { name: string; url: string };
}

export interface YoutubePlaylist {
	id: string;
	title: string;
	length: number;
	url: string;
	items: YoutubeVideo[];
}

export enum YoutubeUrlType {
	Unknown = 0,
	Video = 1 << 0,
	Playlist = 1 << 1,
	Both = Video | Playlist,
}

export interface YouTubeVideoData {
	id: string;
	title: string;
	channel: {
		id: string;
		title: string;
	};
	thumbnails: string;
	publishedAt: Date;
}

export interface YouTubeSearchResult {
	totalResults: number;
	resultsPerPage: number;
	nextPageToken: string;
	items: YouTubeVideoData[];
}

type YouTubeSearchFunc = (query: string, limit: number, callback: (error: Error, result: any) => void) => void;

export class YoutubeService {
	private static readonly INITIAL_VOLUME: number = 0.1;
	private cookie: YoutubeCookie;

	private service: ytnode.YouTube;

	private constructor() {
		this.service = new (<any>ytnode)();
		this.service.setKey(process.env.YOUTUBE_API_KEY);
	}

	public static create(): YoutubeService {
		return new YoutubeService();
	}

	private get requestOptions(): any {
		if (!this.cookie) return {};
		return {
			headers: {
				Cookie: this.cookie.toString(),
			},
		};
	}

	public async initialize(cookiePath?: string): Promise<void> {
		try {
			if (cookiePath) this.cookie = await YoutubeCookie.create(cookiePath);
		} catch (err) {
			log('Something happened while loading provided cookie!', 'Youtube', 'err');
			log(<any>err, 'Youtube', 'err');
		}
	}

	public validateUrl(url: string): YoutubeUrlType {
		let result = YoutubeUrlType.Unknown;

		if (ytdl.validateURL(url)) result |= YoutubeUrlType.Video;
		if (ytpl.validateID(url)) result |= YoutubeUrlType.Playlist;

		return result;
	}

	public async getVideoInfo(url: string): Promise<YoutubeVideo> {
		try {
			const info = await ytdl.getInfo(url, {
				requestOptions: this.requestOptions,
			});
			if (!info) return null;

			return {
				id: info.videoDetails.videoId,
				title: info.videoDetails.title,
				length: +info.videoDetails.lengthSeconds,
				url: info.videoDetails.video_url,
				channel: {
					name: info.videoDetails.ownerChannelName,
					url: info.videoDetails.ownerProfileUrl,
				},
			};
		} catch (err) {
			console.log(err);
			log(<any>err, 'Youtube', 'err');
			return null;
		}
	}

	public async searchVideo(query: string, limit: number = 1): Promise<YouTubeSearchResult> {
		return new Promise((res, rej) => {
			(<YouTubeSearchFunc>this.service.search)(query, limit, (err, result) => {
				if (err) rej(err);
				res({
					totalResults: result?.pageInfo?.totalResults,
					resultsPerPage: result?.pageInfo?.resultsPerPage,
					nextPageToken: result?.nextPageToken,
					items: result?.items?.map((x: any) => ({
						id: x?.id?.videoId,
						title: x?.snippet?.title,
						channel: {
							id: x?.snippet?.channelId,
							title: x?.snippet?.channelTitle,
						},
						thumbnails: x?.snippet?.thumbnails?.high?.url,
						publishedAt: new Date(x?.snippet?.publishedAt),
					})),
				});
			});
		});
	}

	public async getPlaylistInfo(url: string, limit?: number): Promise<YoutubePlaylist> {
		try {
			const info = await ytpl(url, {
				requestOptions: this.requestOptions,
				limit: limit,
			});
			if (!info) return null;

			const result: YoutubePlaylist = {
				id: info.id,
				title: info.title,
				length: info.items.length,
				url: info.url,
				items: [],
			};

			for (let video of info.items) {
				result.items.push({
					id: video.id,
					title: video.title,
					length: video.durationSec,
					url: video.url,
					channel: {
						name: video.author.name,
						url: video.author.url,
					},
				});
			}

			return result;
		} catch (err) {
			log(<any>err, 'Youtube', 'err');
			return null;
		}
	}

	public async getStream(track: VoiceTrack, volume: number = 100): Promise<AudioResource> {
		try {
			const resource = createAudioResource(
				ytdl(track.url, {
					filter: 'audioonly',
					quality: 'highestaudio',
					highWaterMark: 1 << 25,
					requestOptions: this.requestOptions,
				}),
				{
					inputType: StreamType.Arbitrary,
					inlineVolume: true,
				}
			);

			resource.volume.setVolume(YoutubeService.INITIAL_VOLUME * (volume / 100));

			log(`Retrieving youtube stream for id: ${ytdl.getVideoID(track.url)}`, 'Youtube', 'debug');

			return resource;
		} catch (err) {
			log(<any>err, 'Youtube', 'err');
			return null;
		}
	}
}
