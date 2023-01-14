import { ClientEvents } from 'discord.js';
import { Dictionary } from '../types';
import { DiscordCommand } from './discord-command';
import { DiscordEvent } from './discord-event';

export const COMMAND_KEYS = 'commands-keys';
export const SUBCOMMANDS_LIST = 'subcommands-map';

export function Command(args?: { subcommands?: any[] }) {
	return (target: any) => {
		initializeCommands();

		const instance: DiscordCommand = new target();
		if (!instance.aliases || instance.aliases.length == 0) return;

		const commandKeys: Dictionary<DiscordCommand> = Reflect.getMetadata(COMMAND_KEYS, Command);
		commandKeys[instance.aliases[0]] = instance;
		Reflect.defineMetadata(COMMAND_KEYS, commandKeys, Command);

		if (args?.subcommands && args?.subcommands.length > 0) {
			const subcommandsList: Dictionary<Dictionary<DiscordCommand>> = Reflect.getMetadata(
				SUBCOMMANDS_LIST,
				Command
			);
			subcommandsList[instance.aliases[0]] = Dictionary.create<DiscordCommand>();
			for (let subcmd of args.subcommands) {
				const subinstance: DiscordCommand = new subcmd();
				if (!subinstance.aliases || subinstance.aliases.length == 0) continue;

				subcommandsList[instance.aliases[0]][subinstance.aliases[0]] = subinstance;
			}
			Reflect.defineMetadata(SUBCOMMANDS_LIST, subcommandsList, Command);
		}
	};
}

export const EVENTS_KEYS = 'events-keys';

export function Event<K extends keyof ClientEvents>(name: K) {
	return (target: any) => {
		initializeEvents();

		const instance: DiscordEvent<any> = new target();

		const eventKeys: Dictionary<DiscordEvent<any>[]> = Reflect.getMetadata(EVENTS_KEYS, Event);
		const value = eventKeys.get(name) ?? [];
		value.push(instance);
		eventKeys.set(name, value);
		Reflect.defineMetadata(EVENTS_KEYS, eventKeys, Event);
	};
}

function initializeCommands() {
	if (!Reflect.getMetadataKeys(Command).includes(COMMAND_KEYS)) {
		Reflect.defineMetadata(COMMAND_KEYS, Dictionary.create<DiscordCommand>(), Command);
	}

	if (!Reflect.getMetadataKeys(Command).includes(SUBCOMMANDS_LIST)) {
		Reflect.defineMetadata(SUBCOMMANDS_LIST, Dictionary.create<Dictionary<DiscordCommand>>(), Command);
	}
}

function initializeEvents() {
	if (!Reflect.getMetadataKeys(Event).includes(EVENTS_KEYS)) {
		Reflect.defineMetadata(EVENTS_KEYS, Dictionary.create<DiscordEvent<any>[]>(), Event);
	}
}
