import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData, VoiceTrack } from '@app/library/discord/discord-voice';
import { shuffleArray } from '@app/library/utils';
import { PermissionsString } from 'discord.js';

@Command()
export class Shuffle implements DiscordCommand {
	public name: string = 'Shuffle';
	public description: string = 'Embaralha a fila de músicas atual';
	public aliases: string[] = ['shuffle', 'random', 'aleatorio', 'sf'];
	public usage: string[] = [''];
	public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
	public permission: PermissionsString = null;
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
	public requiredArgs: number = 0;
	public args: DiscordCommand.Argument[] = [];

	public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
		const channel = await e.getMemberVoiceChannel();

		if (!channel) {
			await e.reply('Desculpe, mas você não está em um canal de voz!');
			return;
		}

		let voice: DiscordVoiceData = null;

		try {
			voice = await e.getVoiceData();
		} catch (err: any) {
			await e.reply(err);
			return;
		}

		if (voice.queue.length == 0) {
			await e.reply('Desculpe, mas a lista de músicas do servidor está vazia!');
			return;
		}

		let queue = voice.queue.slice(0);
		const curTrack = queue.shift();
		queue = shuffleArray(queue);
		queue.unshift(curTrack);
		voice.queue = queue;

		if (e.isMessage()) await e.react('✅');
		else if (e.isInteraction()) await e.reply('Fila aleatórizada!', false);
	}
}
