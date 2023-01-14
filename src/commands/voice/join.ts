import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { PermissionsString } from 'discord.js';

@Command()
export class Join implements DiscordCommand {
	public name: string = 'Join';
	public description: string = 'Faz eu entrar em um chat de voz!';
	public aliases: string[] = ['join', 'j'];
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

		try {
			await e.getVoiceData(true);
		} catch (err: any) {
			await e.reply(err);
			return;
		}

		if (e.isMessage()) await e.react('✅');
		else if (e.isInteraction()) await e.reply('Estou me juntando com vocês!', false);
	}
}
