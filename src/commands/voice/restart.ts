import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData, VoiceTrack } from '@app/library/discord/discord-voice';
import { PermissionsString } from 'discord.js';
import { RemoveDupes } from './remove-dupes';

@Command()
export class Restart implements DiscordCommand {
	public name: string = 'Restart';
	public description: string = 'Reinicia a música que está tocando!';
	public aliases: string[] = ['restart', 'replay'];
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

		if (voice.queue.length == 0) {
			await e.reply('Desculpe, mas a lista de músicas do servidor está vazia!');
			return;
		}

		await voice.playNext(false);

		if (e.isMessage()) await e.react('✅');
		else if (e.isInteraction()) await e.reply('Reiniciando a música atual!', false);
	}
}
