import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData, VoiceTrack } from '@app/library/discord/discord-voice';
import { PermissionsString } from 'discord.js';
import { RemoveDupes } from './remove-dupes';

@Command()
export class Move implements DiscordCommand {
	public name: string = 'Move';
	public description: string = 'Move uma música de posição na queue!';
	public aliases: string[] = ['move', 'mv'];
	public usage: string[] = ['<posição inicial> <posição final>'];
	public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
	public permission: PermissionsString = null;
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
	public requiredArgs: number = 2;
	public args: DiscordCommand.Argument[] = [
		new DiscordCommand.Argument('Integer', 'posicao_inicial', 'Posição inicial da música na queue', true),
		new DiscordCommand.Argument('Integer', 'posicao_final', 'Posição final da música na queue', true),
	];

	public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
		const channel = await e.getMemberVoiceChannel();

		if (!channel) {
			await e.reply('Desculpe, mas você não está em um canal de voz!');
			return;
		}

		if (!channel.joinable) {
			await e.reply('Desculpe, mas não consigo entrar no mesmo canal de voz que você!');
			return;
		}

		let voice: DiscordVoiceData = null;

		try {
			voice = await e.getVoiceData();
		} catch (err: any) {
			await e.reply(err);
			return;
		}

        const initial = this.validateIndex(e.args[0], -voice.queue.length, voice.queue.length);
        if (initial.error) {
            await e.reply(initial.error);
            return;
        }

        const final = this.validateIndex(e.args[1], -voice.queue.length, voice.queue.length);
        if (final.error) {
            await e.reply(final.error);
            return;
        }

        const initialIndex = initial.index > 0 ? initial.index - 1 : initial.index;
        const finalIndex = final.index > 0 ? final.index - 1 : final.index;

        const removedTrack = voice.queue.splice(initialIndex, 1)[0];
        voice.queue.splice(finalIndex, 0, removedTrack);

		if (finalIndex === 0 || finalIndex === -voice.queue.length) {
			await voice.playNext(false);
		}

        const finalPos = finalIndex < 0 ? voice.queue.length + finalIndex : finalIndex;
		const embed = await removedTrack.toEmbed('🎶 Música movida para ' + (finalPos + 1).toString() + 'ª');

		await e.reply([embed], false);
	}

    private validateIndex(value: string, min: number, max: number): { index?: number, error?: string } {
        const index = +value;

		if (isNaN(index)) {
            return {
                error: `Desculpe, mas ${value} não é um número!`
            };
		}

        if (index > max || index < min || index === 0) {
			return {
                error: `Desculpe, mas ${index} deve ser um valor deferente de 0 e entre ${min} e ${max}`
            };
		}

        return { index };
    }
}
