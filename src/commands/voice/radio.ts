import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData } from '@app/library/discord/discord-voice';
import { createEmbed } from '@app/library/utils';
import { RadioService } from '@app/library/voice/radio.service';
import { databaseService } from '@app/main';
import { Radio } from '@app/models/configuration/radio';
import { PermissionsString } from 'discord.js';

@Command()
export class RadioCmd implements DiscordCommand {
	public name: string = 'Radio';
	public description: string = 'Faz eu entrar em um chat de voz para tocar radio!';
	public aliases: string[] = ['radio'];
	public usage: string[] = ['', '<nome|url>'];
	public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
	public permission: PermissionsString = null;
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
	public requiredArgs: number = 0;
	public args: DiscordCommand.Argument[] = [
		new DiscordCommand.Argument('String', 'radio', 'Nome ou url da radio', false),
	];

	public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
		const repo = databaseService.getRepository(Radio);
		const radios = await repo.createQueryBuilder().getMany();

		if (e.args.length == 0 || e.args[0] == null) {
			await this.listRadios(e, radios);
			return;
		}

		if (!radios.map((x) => x.key).includes(e.args[0])) {
			await e.reply('Desculpe, mas não conheço essa estação de radio!');
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
			voice = await e.getVoiceData(true);
			if (!voice.ensureType('radio')) throw 'Desculpe, mas já estou tocando outra coisa no momento!';
		} catch (err: any) {
			await e.reply(err);
			return;
		}

		const radio = radios.find((x) => x.key == e.args[0]);
		await voice.playRadio(radio.url);

		const user = await e.bot.users.fetch(e.input.member.user.id);
		const embed = createEmbed('🎶 Tocando radio', `Estação: \`${radio.name}\``);
		embed.setFooter({
			text: `Pedida por ${user.tag}`,
			iconURL: user.avatarURL({ forceStatic: true }),
		});

		await e.reply([embed.data], false);
	}

	private async listRadios(
		e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs,
		list: Radio[]
	): Promise<any> {
		const radios = list.map((x) => ` - \`${x.key}\``).join(',\n');
		const desc = 'A lista de radios disponíveis são:\n' + radios;
		const embed = createEmbed('Lista de Radios', desc);

		if (e.isMessage()) await e.send([embed.data]);
		else if (e.isInteraction()) await e.reply([embed.data]);
	}
}
