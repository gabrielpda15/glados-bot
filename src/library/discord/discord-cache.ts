import { AudioPlayer, VoiceConnection } from '@discordjs/voice';
import { Snowflake } from 'discord.js';

export type VoiceCache = Map<Snowflake, { connection: VoiceConnection, player: AudioPlayer }>;

export class DiscordCache {

    public voice: VoiceCache;

    constructor() {
        this.voice = new Map<Snowflake, { connection: VoiceConnection, player: AudioPlayer }>();
    }

}