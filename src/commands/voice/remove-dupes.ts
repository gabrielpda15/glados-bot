import { DiscordCommand } from '@app/library/discord/discord-command';
import { DiscordVoiceData, VoiceTrack } from '@app/library/discord/discord-voice';
import { PermissionsString } from 'discord.js';

export class RemoveDupes implements DiscordCommand {
	public name: string = 'Remove Dupes';
	public description: string = 'Remove músicas duplicadas da queue!';
	public aliases: string[] = ['dupes', 'dp'];
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

		const dupesIndex = voice.queue.reduce((dupes, track, index) => {
			const mappedDupes: number[] = voice.queue.map((secondTrack, secondIndex) => {
				if (index !== secondIndex && 
					!dupes.includes(index) &&
					!dupes.includes(secondIndex) &&
					track.equivalent(secondTrack)) {
						return secondIndex;
					}
			});
			return [...dupes, ...mappedDupes.filter((dupe) => !!dupe)];
		}, [] as number[]);
		
		dupesIndex.sort((a, b) => b - a).forEach((index) => voice.queue.splice(index, 1));

		if (e.isMessage()) await e.react('✅');
		else if (e.isInteraction()) await e.reply(`Removidas ${dupesIndex.length} duplicatas`, false);
	}
}
