import { Client, Collection, Message } from 'discord.js';
import glob from 'glob';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { Connection, ConnectionOptions, createConnection, getConnectionOptions } from 'typeorm';
import { getCommandArguments, getIntents, log, startActivityLoop } from '../utils';
import { DiscordCache } from './discord-cache';
import { DiscordCommand, DiscordCommandInstance, DiscordCommandResult } from './discord-command';
import { DiscordOptions } from './discord-options';
import { ConsoleLogger } from '../typeorm/logger';
import { Command, COMMAND_KEYS, SUBCOMMANDS_LIST } from './discord-decorators';
import { Dictionary } from '../types';

export class DiscordBot extends Client {

    private connectionName: string;
    private connectionOptions: ConnectionOptions;
    private connection: Connection;

    public cache: DiscordCache;
    public commands: Dictionary<DiscordCommandInstance>;
    public commandsMapper: Dictionary<string>;

    constructor(options: DiscordOptions) {
        super(options);

        this.cache = new DiscordCache();
        this.commands = Dictionary.create<DiscordCommandInstance>();
        this.commandsMapper = Dictionary.create<string>();

        this.connectionName = options?.connectionName;
    }

    public async getDbConnection(): Promise<Connection> {
        if (this.connection) {
            return this.connection;
        } else {
            this.connectionOptions = await getConnectionOptions(this.connectionName);
            Object.assign(this.connectionOptions, { logger: new ConsoleLogger() });
            this.connection = await createConnection(this.connectionOptions);
            return this.connection;
        }
    }

    public static create(): DiscordBot {
        return new DiscordBot({
            token: process.env.TOKEN,
            intents: getIntents()
        });
    }

    public async initialize(): Promise<void> {
        return new Promise<void>((res, rej) => {
            glob(path.resolve(__dirname, '../../commands/**/*{.js,.ts}'), async (err, matches) => {
                if (err) rej(err);

                try {
                    matches = matches.map(x => path.normalize(x));
                
                    for (let file of matches) {
                        await import(file);
                    }
    
                    const mainCommands: Dictionary<DiscordCommand> = Reflect.getMetadata(COMMAND_KEYS, Command);
                    const subCommands: Dictionary<Dictionary<DiscordCommand>> = Reflect.getMetadata(SUBCOMMANDS_LIST, Command);
                    
                    for (let item of mainCommands) {
                        let id: string;
                        do { id = uuid() } while(this.commands.has(id));
                        item.value.aliases.forEach(cmd => {
                            this.commandsMapper[cmd] = id;
                        });
    
                        const sc = subCommands[item.value.aliases[0]]?.values() ?? [];
                        const dci = DiscordCommandInstance.create(item.value, ...sc);
    
                        this.commands.set(id, dci);
                    }
                    
                    res();
                } catch(err) {
                    rej(err);
                }                
            });

            if (process.env.DEBUG == 'true') this.on('debug', (m) => log(m, 'Discord', 'info'));

            this.on('ready', (c) => this.onReady(<DiscordBot>c));            
            this.on('messageCreate', (m) => this.onMessageReceived(m));
        });
    }

    public async connect(): Promise<string> {
        return await this.login((<DiscordOptions>this.options).token);
    }

    public getCommand(...args: string[]): DiscordCommandResult {
        const mainCmd = args.shift().toLowerCase();
        const id = this.commandsMapper[mainCmd];
        if (!id) return null;
        
        const instance = this.commands.get(id);
        let result: DiscordCommand = null;
        
        if (args.length > 0 && instance.hasSubcommands) {
            const subCmd = args[0].toLowerCase();
            result = instance.getSubcommand(subCmd);
        }

        if (result == null) return { command: instance.main, args: args, parent: null };
        else return { command: result, args: args.slice(1), parent: instance.main };
    }

    private async onReady(bot: DiscordBot) {
        await startActivityLoop(bot, null);
    }

    private async onMessageReceived(message: Message<boolean>) {
        if (message.author.bot || message.channel.type === 'DM') return;

        const prefixMention = new RegExp(`^<@!?${this.user.id}> `);
        const prefix = message.content.match(prefixMention) ?
            message.content.match(prefixMention)[0] :
            process.env.PREFIX;

        if (!message.content.startsWith(prefix)) return;

        const args = getCommandArguments(message.content.slice(prefix.length).trim());
        const result = this.getCommand(...args);
        const command = result.command;

        if (!command) return;

        const isOwner = (message.author.id == message.guild.ownerId);
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

        const cmdResult = await command.execute(new DiscordCommand.ExecuteArgs(message, result.args));
        if (cmdResult && process.env.DEBUG == 'true') console.log(cmdResult);
    }

}
