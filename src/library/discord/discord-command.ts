import { EmojiIdentifierResolvable, Message, MessageOptions, MessagePayload, MessageReaction, PermissionResolvable, ReplyMessageOptions, VoiceChannel } from 'discord.js';
import { Dictionary } from '../types';
import { DiscordBot } from './discord-bot';
import { v4 as uuid } from 'uuid';
import { createAudioPlayer, joinVoiceChannel } from '@discordjs/voice';

export namespace DiscordCommand {

    export enum Category {
        NONE = 'Nenhuma',
        ADMINISTRATIVE = 'Administrativos',
        FUNNY = 'Divertidos',
        VOICE =  'Voz',
        INFORMATIVE = 'Informativos'
    }

    export class ExecuteArgs {

        public message: Message<boolean>;
        public args: string[];

        public get bot(): DiscordBot {
            return <DiscordBot>this.message?.client;
        }

        constructor(message: Message<boolean>, args: string[]) {
            this.message = message;
            this.args = args;
        }
        
        public async reply(options: string | MessagePayload | ReplyMessageOptions): Promise<Message<boolean>> {
            if (this.message) {
                return await this.message.reply(options);
            }
            return null;
        }

        public async send(options: string | MessagePayload | MessageOptions): Promise<Message<boolean>> {
            if (this.message && this.message.channel) {
                return await this.message.channel.send(options);
            }
            return null;
        }

        public async react(emoji: EmojiIdentifierResolvable): Promise<MessageReaction> {
            return await this.message.react(emoji);
        }

        public async getVoiceData(channel: VoiceChannel) {
            let voice = this.bot.cache.voice.get(channel.guildId);

            if (!voice) {
                voice = {
                    connection: joinVoiceChannel({ 
                        channelId: channel.id,
                        guildId: channel.guildId,
                        adapterCreator: channel.guild.voiceAdapterCreator,
                        selfDeaf: false,
                        selfMute: false
                    }),
                    player: createAudioPlayer()
                };
                voice.connection.subscribe(voice.player);
                voice.connection.on('stateChange', (o, n) => { 
                    if (n.status == 'disconnected') {
                        voice.connection.destroy();
                        this.bot.cache.voice.delete(channel.guildId);
                    }
                });
                this.bot.cache.voice.set(channel.guildId, voice);
            } else if (voice.connection.joinConfig.channelId != channel.id) {
                throw 'Eu já estou em outro canal de voz nesse servidor!';
            }

            return voice;
        }

    }

}

export interface DiscordCommand {

    name: string;
    description: string;
    aliases: string[];
    usage: string[];
    category: DiscordCommand.Category;
    permission: PermissionResolvable;
    onlyOwner: boolean;
    requiredArgs: number;

    execute(e: DiscordCommand.ExecuteArgs): Promise<any>;

}

export interface DiscordCommandResult {

    command: DiscordCommand;
    parent: DiscordCommand;
    args: string[];

}

export class DiscordCommandInstance {
    
    private _main: DiscordCommand;

    private subcommands: Dictionary<DiscordCommand>;
    private subcommandsMapper: Dictionary<string>;

    private constructor() {
        this.subcommands = Dictionary.create<DiscordCommand>();
        this.subcommandsMapper = Dictionary.create<string>();
    }

    public get main(): DiscordCommand {
        return this._main;
    }

    public get hasSubcommands(): boolean {
        return this.subcommands && this.subcommands.length() > 0;
    }

    public getSubcommand(cmd: string): DiscordCommand {
        const id = this.subcommandsMapper[cmd];
        if (id == null) return null;
        return this.subcommands[id];
    }

    public static create(main: DiscordCommand, ...sub: DiscordCommand[]): DiscordCommandInstance {
        const dci = new DiscordCommandInstance();
        dci._main = main;
        
        if (sub && sub.length > 0) {
            for (let item of sub) {
                let id: string;
                do { id = uuid() } while(dci.subcommands.has(id));
                item.aliases.forEach(cmd => {
                    dci.subcommandsMapper[cmd] = id;
                });

                dci.subcommands.set(id, item);
            }
        }

        return dci;
    }

}