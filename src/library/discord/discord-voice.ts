import { discordBot, hostAudioService, radioService, youtubeService } from "@app/main";
import { AudioPlayer, createAudioPlayer, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { APIEmbed, Snowflake, TextChannel, VoiceChannel } from "discord.js";
import { createEmbed, log } from "../utils";
import { YoutubePlaylist, YoutubeVideo } from "../youtube/youtube-service";

export class VoiceTrack extends YoutubeVideo {

    public requestedBy?: Snowflake;

    public static fromYoutubeVideo(base: YoutubeVideo): VoiceTrack {
        const instance = new VoiceTrack();
        for (let key in base) {
            const value = (<any>base)[key];
            if (typeof value != 'function') (<any>instance)[key] = value;
        }
        return instance;
    }

    public async toEmbed(title: string): Promise<APIEmbed> {
        let embed = createEmbed(
            title,
            this.toString()
        );

        if (this.requestedBy) {
            const user = await discordBot.users.fetch(this.requestedBy);
            embed = embed.setFooter({
                text: `Pedida por ${user.tag}`,
                iconURL: user.avatarURL({ forceStatic: true })
            });
        }

        return embed.data;
    }
}

export class VoicePlaylist extends YoutubePlaylist {

    public requestedBy?: Snowflake;

    public static fromYoutubePlaylist(base: YoutubePlaylist): VoicePlaylist {
        const instance = new VoicePlaylist();
        for (let key in base) {
            const value = (<any>base)[key];
            if (typeof value != 'function') (<any>instance)[key] = value;
        }
        return instance;
    }

    public async toEmbed(title: string): Promise<APIEmbed> {
        let embed = createEmbed(
            title,
            `Adicionado(s) \`${this.items.length}\` vídeos para a fila!`
        );

        if (this.requestedBy) {
            const user = await discordBot.users.fetch(this.requestedBy);
            embed = embed.setFooter({
                text: `Pedido por ${user.tag}`,
                iconURL: user.avatarURL({ forceStatic: true })
            });
        }

        return embed.data;
    }

}

export type VoiceQueue = VoiceTrack[];
export type VoiceQueueLoopType = 'all' | 'one' | 'none'

export class DiscordVoiceData {
    
    private type: 'none' | 'youtube' | 'radio' | 'host_audio';

    public readonly connection: VoiceConnection;
    public readonly player: AudioPlayer;
    public readonly voiceChannel: VoiceChannel;
    public readonly textChannel: TextChannel;
    public isPlaying: boolean;
    public volume: number;
    public queue: VoiceQueue;
    public loop: VoiceQueueLoopType;

    constructor(voiceChannel: VoiceChannel, textChannel: TextChannel) {
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;
        this.connection = joinVoiceChannel({ 
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: false
        });
        this.player = createAudioPlayer();
        this.isPlaying = false;
        this.type = 'none';
        this.volume = 100;
        this.queue = [];
        this.loop = 'none';
    }

    public getType(): 'none' | 'youtube' | 'radio' | 'host_audio' { return this.type; }

    public ensureType(type: 'youtube' | 'radio' | 'host_audio'): boolean {
        if (this.type == type) return true;
        if (this.type == 'none') { 
            this.type = type;
            return true;
        }

        return false;
    }

    public async dispose(): Promise<void> {
        if (this.type == 'host_audio') {
            await hostAudioService.disposeStream();
        }
    }

    public async playRadio(radio: string): Promise<void> {
        try {
            if (this.type !== 'radio') throw 'The current discord voice is not set to be radio type';

            if (!this.isPlaying) this.isPlaying = true;

            const stream = await radioService.getStream(<any>radio, this.volume);
            if (!stream) throw 'Radio stream returned null';
            this.player.play(stream);
        } catch (err) {
            log('Something went wrong trying to play the radio!', 'Discord', 'err');
            if (err) log(<any>err, 'Discord', 'err');
            await this.textChannel.send('Deu algo errado ao tentar reproduzir a sua radio!');
        }
    }

    public async playHostAudio(): Promise<void> {
        try {
            if (this.type !== 'host_audio') throw 'The current discord voice is not set to be host_audio type';
            if (this.isPlaying) throw 'I\'m already playing the host audio!'
            this.isPlaying = true;

            const stream = hostAudioService.getStream();
            if (!stream) throw 'Host audio stream returned null';
            this.player.play(stream);
        } catch (err) {
            log('Something went wrong trying to play the host audio!', 'Discord', 'err');
            if (err) log(<any>err, 'Discord', 'err');
            await this.textChannel.send('Deu algo errado ao tentar reproduzir a música local!');
        }
    }

    public async playNext(): Promise<void> {
        try {
            if (this.type !== 'youtube') throw 'The current discord voice is not set to be youtube type';

            if (this.queue.length == 0) {
                if (this.isPlaying) this.connection.disconnect();
                return;
            } else {
                if (this.isPlaying) {
                    if (this.loop == 'none') this.queue.shift();
                    else if (this.loop == 'all') this.queue.push(this.queue.shift());
    
                    if (this.queue.length == 0) {
                        this.connection.disconnect();
                        return;
                    }
                } else {
                    this.isPlaying = true;
                }
    
                const stream = await youtubeService.getStream(this.queue[0].url, this.volume);
                if (!stream) throw 'Youtube stream returned null';
                this.player.play(stream);
            }
        } catch (err) {
            log('Something went wrong trying to play the next song!', 'Discord', 'err');
            if (err) log(<any>err, 'Discord', 'err');
            await this.textChannel.send('Deu algo errado ao tentar reproduzir a próxima música!');
        }        
    }

}