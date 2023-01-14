import { DiscordBot } from '@app/library/discord/discord-bot';
import { DiscordCommand } from '@app/library/discord/discord-command';
import { Event } from '@app/library/discord/discord-decorators';
import { DiscordEvent } from '@app/library/discord/discord-event';
import { getCommandArguments, log } from '@app/library/utils';
import { Message } from 'discord.js';

@Event('messageCreate')
export class CommandHandler implements DiscordEvent<'messageCreate'> {
	public async execute(message: Message<boolean>): Promise<any> {
		if (message.author.bot || message.channel.isDMBased()) return;

		// const repo = databaseService.getRepository(Config);
		// const whiteList = await repo.findOne({ where: { key: 'whiteList' }});
		// const whiteListParsed: string[] = JSON.parse(whiteList.value);

		// if (!whiteListParsed.includes(message.channelId)) return;

		const prefixMention = new RegExp(`^<@!?${message.client.user.id}> `);
		const prefix = message.content.match(prefixMention)
			? message.content.match(prefixMention)[0]
			: process.env.PREFIX;

		if (!message.content.startsWith(prefix)) return;

		const args = getCommandArguments(message.content.slice(prefix.length).trim());
		const result = (<DiscordBot>message.client).getCommand(...args);
		const command = result.command;

		if (!command) return;

		const isOwner = message.author.id == message.guild.ownerId;
		if (command.onlyOwner == true && !isOwner) {
			await message.reply('Esse comando é restrito ao dono do server!');
			return;
		}

		if (command.permission && !message.member.permissions.has(command.permission)) {
			await message.reply('Você não possui permissões suficientes para executar esse comando!');
			return;
		}

		if (command.requiredArgs > result.args.length) {
			let reply = 'Esse comando requer argumentos!';
			reply += `\nVocê providenciou apenas ${result.args.length} de ${command.requiredArgs} dos argumentos necessários.`;

			if (command.usage.length > 0) {
				reply += `\nO modo correto de usar esse comando seria:`;
				for (let usage of command.usage) {
					if (result.parent == null) {
						reply += `\n   - \`${process.env.PREFIX}${command.aliases[0]} ${usage}\``;
					} else {
						reply += `\n   - \`${process.env.PREFIX}${result.parent.aliases[0]} ${command.aliases[0]} ${usage}\``;
					}
				}
			}

			message.reply(reply);
			return;
		}

		try {
			const cmdResult = await command.execute(DiscordCommand.ExecuteArgs.create(message, result.args));
			if (cmdResult) log(cmdResult, 'Discord', 'debug');
		} catch (err) {
			await message.reply(`💥 😵‍💫 Alguma coisa explodiu do nosso lado! Vamos esperar que não aconteça de novo!`);
			log(<any>err, 'Discord', 'err');
		}
	}
}
