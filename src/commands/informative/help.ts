import { DiscordCommand, DiscordCommandInstance } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { createEmbed, findSimilarStrings, groupBy } from '@app/library/utils';
import { EmbedBuilder, PermissionsString } from 'discord.js';

// TODO: Melhorar listagem do help para implementar o sistema de subcommando
@Command()
export class Help implements DiscordCommand {
	public name: string = 'Ajuda';
	public description: string = 'Mostra a minha lista de comandos ou ajuda para um comandos especifico.';
	public aliases: string[] = ['help', 'ajuda', 'comandos'];
	public usage: string[] = ['', '<nome do comando>'];
	public category: DiscordCommand.Category = DiscordCommand.Category.INFORMATIVE;
	public permission: PermissionsString = null;
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
	public requiredArgs: number = 0;
	public args: DiscordCommand.Argument[] = [
		new DiscordCommand.Argument('String', 'comando', 'Nome do comando para ver detalher sobre.', false),
	];

	public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
		let embed: EmbedBuilder;

		if (e.args && e.args.length > 0 && e.args[0]) {
			embed = this.getCommandHelp(e);
		} else {
			embed = this.getCommandList(e.bot.commands.values());
		}

		await e.reply([embed.data]);
	}

	private getCommandList(commands: DiscordCommandInstance[]): EmbedBuilder {
		let embed = createEmbed(
			'Lista de comandos',
			`Utilize \`${process.env.PREFIX}help <nome do comando>\` para obter ajuda mais detalhada!`
		);

		const groups = groupBy(
			commands,
			(i) => i.main.category,
			(i) => `\`${i.main.aliases[0]}\``
		);

		for (let key in groups) {
			const desc = groups[key].join(', ');
			if (desc != null && desc.trim() != '') embed.addFields({ name: key, value: desc });
		}

		return embed;
	}

	private getCommandHelp(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): EmbedBuilder {
		let embed: EmbedBuilder;
		const cmdResult = e.bot.getCommand(...e.args);
		const cmd = cmdResult.command;

		if (cmd == null) {
			// TODO: Melhorar implementação do similar
			const similar = findSimilarStrings(Object.keys(e.bot.commandsMapper), e.args[0], 3, false);
			let desc = 'Você quis dizer:\n\n';
			for (let item of similar) {
				desc += `  - \`${item}\`\n`;
			}
			embed = createEmbed('Comando não encontrado!', desc);
			return embed;
		}

		embed = createEmbed(`Ajuda: **${cmd.name}**`, cmd.description);
		let temp: string = null;

		if (cmd.usage && cmd.usage.length > 0) {
			const cmdPrefix = `${process.env.PREFIX}${cmd.aliases[0]}`;
			temp = cmd.usage
				.map((x) => (x == '' ? cmdPrefix : `${cmdPrefix} ${x}`))
				.map((x) => `\`${x}\``)
				.join(', ');
			if (temp != null && temp.trim() != '')
				embed.addFields({
					name: cmd.usage.length == 1 ? 'Uso' : 'Usos',
					value: temp,
				});
		}

		if (cmd.aliases && cmd.aliases.length > 0) {
			let aliasPrefix = '';
			if (cmdResult.parent != null) {
				aliasPrefix = cmdResult.parent.aliases[0] + ' ';
			}
			temp = cmd.aliases.map((x) => `\`${aliasPrefix}${x}\``).join(', ');
			if (temp != null && temp.trim() != '')
				embed.addFields({
					name: cmd.aliases.length == 1 ? 'Atalho' : 'Atalhos',
					value: temp,
				});
		}

		return embed;
	}
}
