import { AudioResource, createAudioResource, StreamType } from '@discordjs/voice';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import { log } from '../utils';
import { YoutubeCookie } from './youtube-cookie';

export class YoutubeVideo {

    public id: string;
    public title: string;
    public length: number;
    public url: string;
    public channel: { name: string, url: string };

    public toString(): string {
        const min = Math.floor(this.length / 60);
        const sec = this.length - min * 60;
        const time = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        return `[${this.title}](${this.url}) \`${time}\``;
    }
    
}

export class YoutubePlaylist {

    public id: string;
    public title: string;
    public length: number;
    public url: string;
    public items: YoutubeVideo[];

}

export enum YoutubeUrlType {
    Unknown = 0,
    Video = 1 << 0,
    Playlist = 1 << 1,
    Both = Video | Playlist
}

export class YoutubeService {

    private static readonly INITIAL_VOLUME: number = 0.1;
    private cookie: YoutubeCookie;

    private constructor() { }

    public static create(): YoutubeService {
        return new YoutubeService();
    }

    private get requestOptions(): any {
        if (!this.cookie) return { };
        return {
            headers: {
                Cookie: this.cookie.toString()
            }
        } 
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
                requestOptions: this.requestOptions
            });
            if (!info) return null;

            return {
                id: info.videoDetails.videoId,
                title: info.videoDetails.title,
                length: +info.videoDetails.lengthSeconds,
                url: info.videoDetails.video_url,
                channel: {
                    name: info.videoDetails.ownerChannelName,
                    url: info.videoDetails.ownerProfileUrl
                }
            }
        } catch(err) {
            log(<any>err, 'Youtube', 'err');
            return null;
        }        
    }

    public async getPlaylistInfo(url: string, limit?: number): Promise<YoutubePlaylist> {
        try {
            const info = await ytpl(url, {
                requestOptions: this.requestOptions,
                limit: limit
            });
            if (!info) return null;

            const result: YoutubePlaylist = {
                id: info.id,
                title: info.title,
                length: info.items.length,
                url: info.url,
                items: []
            };

            for (let video of info.items) {
                result.items.push({
                    id: video.id,
                    title: video.title,
                    length: video.durationSec,                    
                    url: video.url,
                    channel: {
                        name: video.author.name,
                        url: video.author.url
                    }
                });
            }

            return result;
        } catch (err) {
            log(<any>err, 'Youtube', 'err');
            return null;
        }
    }
    
    public async getStream(url: string, volume: number = 100): Promise<AudioResource> {
        try {
            const resource = createAudioResource(ytdl(url, {
                filter: "audioonly",
                quality: 'highestaudio',
                highWaterMark: 1 << 25,
                requestOptions: this.requestOptions
            }), {
                inputType: StreamType.Arbitrary,
                inlineVolume: true
            });
    
            resource.volume.setVolume(YoutubeService.INITIAL_VOLUME * (volume / 100));
    
            log(`Retrieving youtube stream for id: ${ytdl.getVideoID(url)}`, 'Youtube', 'info');
    
            return resource;
        } catch (err) {
            log(<any>err, 'Youtube', 'err');
            return null;
        }        
    }

}