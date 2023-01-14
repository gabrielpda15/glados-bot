import { AudioPlayer, VoiceConnection } from '@discordjs/voice';
import { Snowflake } from 'discord.js';
import { DiscordVoiceData } from './discord-voice';

export type VoiceCache = Map<Snowflake, DiscordVoiceData>;

export class DiscordCache {
	public voice: VoiceCache;

	constructor() {
		this.voice = new Map<Snowflake, DiscordVoiceData>();
	}
}
