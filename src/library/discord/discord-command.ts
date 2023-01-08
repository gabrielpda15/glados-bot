import { 
    APIEmbed,
    Base,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    Embed,
    EmojiIdentifierResolvable, InteractionReplyOptions, Message, MessageCreateOptions, 
    MessagePayload, MessageReaction, MessageReplyOptions, 
    PermissionsString, 
    SlashCommandBuilder, 
    SlashCommandSubcommandBuilder, 
    TextChannel, 
    VoiceChannel,
    WebhookEditMessageOptions
} from 'discord.js';
import { Dictionary } from '../types';
import { DiscordBot } from './discord-bot';
import { v4 as uuid } from 'uuid';
import { youtubeService } from '@app/main';
import { DiscordVoiceData } from './discord-voice';

export namespace DiscordCommand {

    export enum DeferType {
        NO = 0,
        YES = 1,
        EPHEMERAL = 2
    }

    export enum Category {
        NONE = 'Nenhuma',
        ADMINISTRATIVE = 'Administrativos',
        FUNNY = 'Divertidos',
        VOICE =  'Voz',
        INFORMATIVE = 'Informativos'
    }

    export type ArgumentType =
        'Attachment' | 'Boolean' | 'Channel' | 'Integer' |
        'Mention' | 'Number' | 'Role' | 'String' | 
        'User' | 'Enum';

    export class Argument {
        
        private static readonly funcMapper: { [key: string]: string } = {
            Attachment: 'addAttachmentOption',
            Boolean: 'addBooleanOption',
            Channel: 'addChannelOption',
            Integer: 'addIntegerOption',
            Mention: 'addMentionableOption',
            Number: 'addNumberOption',
            Role: 'addRoleOption',
            String: 'addStringOption',
            User: 'addUserOption',
            Enum: 'addStringOption'
        }

        private static readonly optMapper: { [key: string]: string } = {
            Attachment: 'getAttachment',
            Boolean: 'getBoolean',
            Channel: 'getChannel',
            Integer: 'getInteger',
            Mention: 'getMember',
            Number: 'getNumber',
            Role: 'getRole',
            String: 'getString',
            User: 'getUser',
            Enum: 'getString'
        }

        private static readonly basicMapper: { [key: string]: boolean } = {
            Attachment: false,
            Boolean: true,
            Channel: false,
            Integer: true,
            Mention: false,
            Number: true,
            Role: false,
            String: true,
            User: false,
            Enum: true
        }

        public readonly type: ArgumentType;
        public readonly name: string;
        public readonly description: string;
        public readonly required: boolean;
        public readonly autocomplete: boolean;
        public readonly choices: string[];

        constructor(
            type: ArgumentType, 
            name: string, 
            desc: string, 
            required: boolean = false, 
            autocomplete: boolean = false,
            choices: string[] = []) {
            this.type = type;
            this.name = name;
            this.description = desc;
            this.required = required;
            this.autocomplete = autocomplete;
            this.choices = choices;
        }

        public getValue(options: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>): { value: any, isBasic: boolean } {            
            return { 
                value: (<any>options)[Argument.optMapper[this.type]](this.name, false),
                isBasic: Argument.basicMapper[this.type]
            };
        }

        public apply(cmd: SlashCommandSubcommandBuilder): void;

        public apply(cmd: SlashCommandBuilder): void;

        public apply(cmd: any): void {
            const func = cmd[Argument.funcMapper[this.type]];
            if (typeof func == 'function') {
                if (this.type == 'Enum') {
                    cmd[Argument.funcMapper[this.type]]((opt: any) =>
                        opt.setName(this.name)
                        .setDescription(this.description)
                        .setRequired(this.required)
                        .setChoices(...this.choices)
                        .setAutocomplete(this.autocomplete)
                    );
                } else {
                    cmd[Argument.funcMapper[this.type]]((opt: any) =>
                        opt.setName(this.name)
                        .setDescription(this.description)
                        .setRequired(this.required)
                    );
                }                
            }            
        }
    }

    export abstract class ExecuteArgs<T extends Base> {

        public readonly input: T;
        public readonly args: string[];

        public get bot(): DiscordBot {
            return <DiscordBot>this.input?.client;
        }

        constructor(input: T, args: string[]) {
            this.input = input;
            this.args = args;
        }

        public static create(
            input: Message | ChatInputCommandInteraction, 
            args: string[]
        ): MessageExecuteArgs | InteractionExecuteArgs {
            if (input instanceof Message) return new MessageExecuteArgs(input, args);
            if (input instanceof ChatInputCommandInteraction) return new InteractionExecuteArgs(input, args);
        }

        public abstract isMessage(): this is MessageExecuteArgs;

        public abstract isInteraction(): this is InteractionExecuteArgs;

        public abstract getMemberVoiceChannel(): Promise<VoiceChannel>;

        public async getVoiceData(forceJoin: boolean = false): Promise<DiscordVoiceData> {
            const voiceChannel = await this.getMemberVoiceChannel();
            if (!voiceChannel) throw 'Desculpe, mas você não está em um canal de voz!';
            let textChannel: TextChannel;
            if (this.isMessage() && this.input.channel instanceof TextChannel) textChannel = this.input.channel;
            if (this.isInteraction() && this.input.channel instanceof TextChannel) textChannel = this.input.channel;
            if (!textChannel) throw 'Desculpe, mas você não está em um canal de voz!';

            let voice: DiscordVoiceData = this.bot.cache.voice.get(voiceChannel.guildId);

            if (!voice) {
                if (!forceJoin) throw 'Eu ainda não estou em nenhum canal de voz!';
                voice = new DiscordVoiceData(voiceChannel, textChannel);
                voice.connection.subscribe(voice.player);
                voice.connection.on('stateChange', async (o, n) => { 
                    if (n.status == 'disconnected') {
                        await voice.dispose();
                        voice.connection.destroy();
                        this.bot.cache.voice.delete(voiceChannel.guildId);
                    }
                });
                voice.player.on('stateChange', async (o, n) => {
                    if (n.status == 'idle' && voice.getType() == 'youtube') {
                        await voice.playNext();
                    }
                });
                this.bot.cache.voice.set(voiceChannel.guildId, voice);
            } else if (voice.connection.joinConfig.channelId != voiceChannel.id) {
                throw 'Eu já estou em outro canal de voz nesse servidor!';
            }

            return voice;
        }
    }

    export class MessageExecuteArgs extends ExecuteArgs<Message> {

        constructor(message: Message, args: string[]) {
            super(message, args);
        }

        public isMessage(): this is MessageExecuteArgs { return true; }

        public isInteraction(): this is InteractionExecuteArgs { return false; }

        public async getMemberVoiceChannel(): Promise<VoiceChannel> {
            return <VoiceChannel>this.input.member.voice.channel;
        }

        public async reply(options: string | APIEmbed[] | MessagePayload | MessageReplyOptions): Promise<Message> {
            if (options instanceof Array<APIEmbed>)
                return await this.input.reply({ embeds: options });
            return await this.input.reply(options);
        }

        public async send(options: string | APIEmbed[] | MessagePayload | MessageCreateOptions): Promise<Message> {
            if (options instanceof Array<APIEmbed>)
                return await this.input.channel.send({ embeds: options });
            return await this.input.channel.send(options);
        }

        public async react(emoji: EmojiIdentifierResolvable): Promise<MessageReaction> {
            return await this.input.react(emoji);
        }
    }

    export class InteractionExecuteArgs extends ExecuteArgs<ChatInputCommandInteraction> {

        constructor(interaction: ChatInputCommandInteraction, args: string[]) {
            super(interaction, args);
        }

        public isMessage(): this is MessageExecuteArgs { return false; }

        public isInteraction(): this is InteractionExecuteArgs { return true; }

        public async getMemberVoiceChannel(): Promise<VoiceChannel> {
            const guild = this.bot.guilds.cache.get(this.input.guildId);
            const member = guild.members.cache.get(this.input.member.user.id);
            return <VoiceChannel>member.voice.channel;
        }
        
        public async reply(options: string | APIEmbed[] | InteractionReplyOptions & { fetchReply: true }, ephemeral: boolean = true): Promise<Message> {
            if (this.input.deferred || this.input.replied) return await this.edit(options);

            if (typeof options == 'string') 
                return this.input.reply({ content: options, fetchReply: true, ephemeral: ephemeral });
            if (options instanceof Array<APIEmbed>)
                return this.input.reply({ embeds: options, fetchReply: true, ephemeral: ephemeral });

            return await this.input.reply(options);
        }

        public async send(options: string | APIEmbed[] | MessagePayload | MessageCreateOptions): Promise<Message> {
            if (options instanceof Array<APIEmbed>)
                return this.input.channel.send({ embeds: options });

            return await this.input.channel.send(options);
        }

        private async edit(options: string | APIEmbed[] | MessagePayload | WebhookEditMessageOptions): Promise<Message> {
            if (options instanceof Array<APIEmbed>)
                return this.input.editReply({ embeds: options });

            return await this.input.editReply(options);
        }

        public async react(emoji: EmojiIdentifierResolvable): Promise<Message> {
            return await this.reply({ content: emoji.toString(), fetchReply: true, ephemeral: true });
        }
    }

}

export interface DiscordCommand {

    name: string;
    description: string;
    aliases: string[];
    usage: string[];
    category: DiscordCommand.Category;
    permission: PermissionsString;
    onlyOwner: boolean;
    defer: DiscordCommand.DeferType;
    requiredArgs: number;
    args: DiscordCommand.Argument[];

    execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any>;

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