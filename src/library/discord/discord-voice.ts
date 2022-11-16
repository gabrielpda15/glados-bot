import { discordBot, youtubeService } from "@app/main";
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
        this.volume = 100;
        this.queue = [];
        this.loop = 'none';
    }

    public async playNext(): Promise<void> {
        try {
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
                if (!stream) throw null;
                this.player.play(stream);
            }
        } catch (err) {
            log('Something went wrong trying to play the next song!', 'Discord', 'err');
            if (err) log(<any>err, 'Discord', 'err');
            await this.textChannel.send('Deu algo errado ao tentar reproduzir a próxima música!');
        }        
    }

}