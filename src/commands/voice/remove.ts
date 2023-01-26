import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData, VoiceTrack } from '@app/library/discord/discord-voice';
import { PermissionsString } from 'discord.js';
import { RemoveDupes } from './remove-dupes';

@Command({
	subcommands: [ RemoveDupes ]
})
export class Remove implements DiscordCommand {
	public name: string = 'Remove';
	public description: string = 'Remove uma música da queue!';
	public aliases: string[] = ['remove', 'rm'];
	public parentAlias?: string = 'at';
	public usage: string[] = ['<posição da música>'];
	public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
	public permission: PermissionsString = null;
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
	public requiredArgs: number = 1;
	public args: DiscordCommand.Argument[] = [
		new DiscordCommand.Argument('Integer', 'posicao', 'Posição da música na queue', true),
	];

	public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
		const index = +e.args[0];

		if (isNaN(index)) {
			await e.reply(`Desculpe, mas ${e.args[0]} não é um número!`);
			return;
		}

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

		if (index > voice.queue.length || index < -voice.queue.length || index === 0) {
			await e.reply(
				`Desculpe, mas ${index} deve ser um valor deferente de 0 e entre ${-voice.queue.length} e ${voice.queue.length}`
			);
			return;
		}

		let removedTrack: VoiceTrack;
		if (index > 0) {
			removedTrack = voice.queue.splice(index - 1, 1)[0];
		} else {
			removedTrack = voice.queue.splice(index, 1)[0];
		}

		if (index === 1 || index === -voice.queue.length - 1) {
			await voice.playNext(false);
		}

		const embed = await removedTrack.toEmbed('🎶 Música Removida');

		await e.reply([embed], false);
	}
}
