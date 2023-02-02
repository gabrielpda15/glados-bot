import { DiscordBot } from '@app/library/discord/discord-bot';
import { Event } from '@app/library/discord/discord-decorators';
import { DiscordEvent } from '@app/library/discord/discord-event';
import { DiscordVoiceData } from '@app/library/discord/discord-voice';
import { VoiceState } from 'discord.js';

@Event('voiceStateUpdate')
export class OnReadyEvent implements DiscordEvent<'voiceStateUpdate'> {
    public async execute(oldState: VoiceState, newState: VoiceState): Promise<any> {
        const bot = <DiscordBot>oldState.client;
        const voice = bot.cache.voice.get(oldState.guild.id);
        if (!voice) return;
        if (
            oldState.channelId === voice.voiceChannel.id && 
            newState.channelId !== voice.voiceChannel.id
        ) {
            if (voice.voiceChannel.members.every((member) => member.user.bot)) {
                setTimeout(async () => {
                    if (voice.voiceChannel.members.every((member) => member.user.bot)) {
                        await voice.textChannel.send('Eu vou embora! Já faz 2 minutos que estou sozinha :sob:');
                        voice.connection.disconnect();
                    }
                }, 120000);
            }
        }
    }
}
