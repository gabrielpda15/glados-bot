import { Dictionary } from '../types';
import { DiscordBot } from './discord-bot';
import { DiscordCommand } from './discord-command';

export const COMMAND_KEYS = 'commands-keys';
export const SUBCOMMANDS_LIST = 'subcommands-map';

export function Command(args?: { subcommands?: any[] }) {
    return (target: any) => {        
        initialize();

        const instance: DiscordCommand = new target();
        if (!instance.aliases || instance.aliases.length == 0) return;
        
        const commandKeys: Dictionary<DiscordCommand> = Reflect.getMetadata(COMMAND_KEYS, Command);
        commandKeys[instance.aliases[0]] = instance;
        Reflect.defineMetadata(COMMAND_KEYS, commandKeys, Command);

        if (args?.subcommands && args?.subcommands.length > 0) {
            const subcommandsList: Dictionary<Dictionary<DiscordCommand>> = Reflect.getMetadata(SUBCOMMANDS_LIST, Command);
            subcommandsList[instance.aliases[0]] = Dictionary.create<DiscordCommand>();
            for (let subcmd of args.subcommands) {
                const subinstance: DiscordCommand = new subcmd();
                if (!subinstance.aliases || subinstance.aliases.length == 0) continue;

                subcommandsList[instance.aliases[0]][subinstance.aliases[0]] = subinstance;
            }
            Reflect.defineMetadata(SUBCOMMANDS_LIST, subcommandsList, Command);
        }
    }
}

function initialize() {
    if (!Reflect.getMetadataKeys(Command).includes(COMMAND_KEYS)) {
        Reflect.defineMetadata(COMMAND_KEYS, Dictionary.create<DiscordCommand>(), Command);
    }

    if (!Reflect.getMetadataKeys(Command).includes(SUBCOMMANDS_LIST)) {
        Reflect.defineMetadata(SUBCOMMANDS_LIST, Dictionary.create<Dictionary<DiscordCommand>>(), Command);
    }
}