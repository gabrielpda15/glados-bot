import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { createAudioResource, StreamType } from '@discordjs/voice';
import { PermissionResolvable, VoiceChannel } from 'discord.js';

@Command()
export class Playtest implements DiscordCommand {

    public name: string = 'Playtest';
    public description: string = '';
    public aliases: string[] = [ 'playtest' ];
    public usage: string[] = [ '' ];
    public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
    public permission: PermissionResolvable = null;
    public onlyOwner: boolean = false;
    public requiredArgs: number = 0;

    public async execute(e: DiscordCommand.ExecuteArgs): Promise<any> {
        if (!e.message.member.voice.channel) {
            return;
        }

        if (!e.message.member.voice.channel.joinable) {
            return;
        }

        const channel = <VoiceChannel>e.message.member.voice.channel;
        const voice = await e.getVoiceData(channel);

        const testAudio = 'https://storage.googleapis.com/vocodes-public/tts_inference_output/b/1/7/vocodes_b17cc69b-9b6c-4c1f-8e74-38513f9b69cc.wav';// 'https://storage.googleapis.com/vocodes-public/tts_inference_output/b/1/7/vocodes_b17cc69b-9b6c-4c1f-8e74-38513f9b69cc.wav';
        const resource = createAudioResource(testAudio, { inputType: StreamType.Arbitrary });
        
        voice.player.play(resource);
    }

}