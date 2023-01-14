import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { DiscordVoiceData } from '@app/library/discord/discord-voice';
import { createEmbed } from '@app/library/utils';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonComponentData,
	ButtonStyle,
	CollectedInteraction,
	ComponentType,
	EmbedBuilder,
	InteractionCollector,
	Message,
	PermissionsString,
} from 'discord.js';

const backButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Secondary)
	.setLabel('Anterior')
	.setEmoji('⬅️')
	.setCustomId('back');

const forwardButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Secondary)
	.setLabel('Próximo')
	.setEmoji('➡️')
	.setCustomId('forward');

@Command()
export class Queue implements DiscordCommand {
	public name: string = 'Queue';
	public description: string = 'Mostra a lista de musicas atuais!';
	public aliases: string[] = ['queue', 'q'];
	public usage: string[] = [''];
	public category: DiscordCommand.Category = DiscordCommand.Category.VOICE;
	public permission: PermissionsString = null;
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.YES;
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

		let pages: string[] = [];
		let desc = '';

		for (let i = 1; i <= voice.queue.length; i++) {
			const track = voice.queue[i - 1];
			const min = Math.floor(track.length / 60);
			const sec = track.length - min * 60;
			const time = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
			const toAdd = `\`${i.toString().padStart(2, '0')}\`. [${track.title}](${track.url}) \`${time}\`\n`;
			if ((desc + toAdd).length > 4096) {
				desc = desc.slice(0, -1);
				pages.push(desc);
				desc = toAdd;
			} else {
				desc += toAdd;
			}
		}

		desc = desc.slice(0, -1);
		const isMultiPage = pages.length > 0;
		if (isMultiPage) pages.push(desc);

		const embed = createEmbed('Lista de músicas', isMultiPage ? pages[0] : desc);
		const rowBuilder = new ActionRowBuilder<ButtonBuilder>().addComponents(forwardButton);

		const components = isMultiPage ? [rowBuilder] : [];

		let embedMessage: Message<boolean>;

		if (e.isMessage()) embedMessage = await e.send({ embeds: [embed.data], components: components });
		else if (e.isInteraction())
			embedMessage = await e.reply({ embeds: [embed.data], components: components, fetchReply: true });

		if (!isMultiPage) return;

		const user = e.isMessage() ? e.input.author.id : e.isInteraction() ? e.input.user.id : null;
		const collector = embedMessage.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 120000,
			filter: (arg) => arg.user.id == user,
		});

		let currentIndex: number = 0;
		collector.on('collect', async (interaction) => {
			interaction.customId === 'back' ? currentIndex-- : currentIndex++;
			embed.setDescription(pages[currentIndex]);
			const row = new ActionRowBuilder<ButtonBuilder>();
			if (currentIndex > 0) row.addComponents(backButton);
			if (currentIndex < pages.length - 1) row.addComponents(forwardButton);
			await interaction.update({
				embeds: [embed.data],
				components: [row],
			});
		});
	}
}
