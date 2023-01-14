import {
	Client,
	Guild,
	PermissionFlagsBits,
	Routes,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
} from 'discord.js';
import { v4 as uuid } from 'uuid';
import { Dictionary } from '../types';
import { DiscordEvent } from './discord-event';
import { getIntents, glob, log } from '../utils';
import { DiscordCache } from './discord-cache';
import { DiscordOptions } from './discord-options';
import { DiscordCommand, DiscordCommandInstance, DiscordCommandResult } from './discord-command';
import { Command, COMMAND_KEYS, Event, EVENTS_KEYS, SUBCOMMANDS_LIST } from './discord-decorators';

export class DiscordBot extends Client {
	public cache: DiscordCache;

	private slashCommands: SlashCommandBuilder[];
	public commands: Dictionary<DiscordCommandInstance>;
	public commandsMapper: Dictionary<string>;

	constructor(options: DiscordOptions) {
		super(options);

		this.cache = new DiscordCache();

		this.slashCommands = [];
		this.commands = Dictionary.create<DiscordCommandInstance>();
		this.commandsMapper = Dictionary.create<string>();
	}

	public static create(): DiscordBot {
		return new DiscordBot({
			token: process.env.TOKEN,
			intents: getIntents(),
		});
	}

	public async initialize(): Promise<void> {
		await this.loadCommands();
		await this.loadEvents();
	}

	private async loadCommands(): Promise<void> {
		log('Loading commands...', 'Discord', 'info');

		const matches = await glob('commands/**/*{.js,.ts}');

		if (matches.length == 0) {
			log('No commands has been loaded!', 'Discord', 'warn');
			return;
		}

		for (let file of matches) {
			await import(file);
		}

		const mainCommands: Dictionary<DiscordCommand> = Reflect.getMetadata(COMMAND_KEYS, Command);
		const subCommands: Dictionary<Dictionary<DiscordCommand>> = Reflect.getMetadata(SUBCOMMANDS_LIST, Command);

		if (!mainCommands) {
			log('Something went wrong while loading commands.', 'Discord', 'err');
			return;
		}

		for (let item of mainCommands) {
			let id: string;
			do {
				id = uuid();
			} while (this.commands.has(id));
			item.value.aliases.forEach((cmd) => {
				this.commandsMapper[cmd] = id;
			});

			const sc = subCommands[item.value.aliases[0]]?.values() ?? [];
			const dci = DiscordCommandInstance.create(item.value, ...sc);

			if (!item.value.onlyOwner) {
				const slashCmd = new SlashCommandBuilder()
					.setName(item.value.aliases[0])
					.setDescription(item.value.description)
					.setDefaultMemberPermissions(PermissionFlagsBits[item.value.permission]);

				for (let arg of item.value.args) {
					arg.apply(slashCmd);
				}

				// TODO: Verificar como fazer um comando padrão alem dos sub comandos

				for (let subCmd of sc) {
					const slashSubCmd = new SlashCommandSubcommandBuilder()
						.setName(subCmd.aliases[0])
						.setDescription(subCmd.description);

					for (let arg of subCmd.args) {
						arg.apply(slashSubCmd);
					}

					slashCmd.addSubcommand(slashSubCmd);
				}

				this.slashCommands.push(slashCmd);
			}

			this.commands.set(id, dci);
		}

		log(`Loaded ${mainCommands.length()} commands!`, 'Discord', 'info');
	}

	private async loadEvents(): Promise<void> {
		log('Loading events...', 'Discord', 'info');

		const matches = await glob('events/**/*{.js,.ts}');

		if (matches.length == 0) {
			log('No events has been loaded!', 'Discord', 'warn');
			return;
		}

		for (let file of matches) {
			await import(file);
		}

		const events: Dictionary<DiscordEvent<any>[]> = Reflect.getMetadata(EVENTS_KEYS, Event);
		if (!events) {
			log('Something went wrong while loading events.', 'Discord', 'err');
			return;
		}

		for (let key of events.keys()) {
			for (let item of events.get(key)) {
				this.on(key, item.execute);
			}
		}

		log(`Loaded ${events.length()} events!`, 'Discord', 'info');
	}

	public async reloadSlashCommands(guild?: Guild): Promise<any> {
		const result: any = await this.rest.put(Routes.applicationGuildCommands(this.application.id, guild.id), {
			body: this.slashCommands.map((sc) => sc.toJSON()),
		});
		log(`Successfuly reloaded ${result.length} slash commands on ${guild.name}`, 'Discord', 'info');
	}

	public async connect(): Promise<string> {
		return await this.login((<DiscordOptions>this.options).token);
	}

	public getCommand(...args: string[]): DiscordCommandResult {
		const mainCmd = args.shift().toLowerCase();
		const id = this.commandsMapper[mainCmd];
		if (!id) return { command: null, args: args, parent: null };

		const instance = this.commands.get(id);
		let result: DiscordCommand = null;

		if (args.length > 0 && instance.hasSubcommands) {
			const subCmd = args[0].toLowerCase();
			result = instance.getSubcommand(subCmd);
		}

		if (result == null) return { command: instance.main, args: args, parent: null };
		else return { command: result, args: args.slice(1), parent: instance.main };
	}
}
