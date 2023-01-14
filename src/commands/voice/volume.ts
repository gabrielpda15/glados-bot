import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData } from '@app/library/discord/discord-voice';
import { PermissionsString } from 'discord.js';

@Command()
export class Volume implements DiscordCommand {
	public name: string = 'Volume';
	public description: string = 'Muda o volume da musica que eu estou tocando.';
	public aliases: string[] = ['volume'];
	public usage: string[] = ['<volume>'];
	public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
	public permission: PermissionsString = null;
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
	public requiredArgs: number = 1;
	public args: DiscordCommand.Argument[] = [
		new DiscordCommand.Argument('Integer', 'valor', 'Um número de 1 à 200 para o volume', true),
	];

	public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
		const volume = +e.args[0];

		if (volume <= 0 || volume >= 201) {
			await e.reply(`Desculpe, mas o volume deve ser entre 0% e 200%!`);
			return;
		}

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

		voice.volume = volume;

		if (e.isMessage()) await e.react('✅');
		else if (e.isInteraction()) await e.reply(`Volume definido para ${volume}%`, false);
	}
}
