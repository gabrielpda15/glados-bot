import { DiscordBot } from '@app/library/discord/discord-bot';
import { DiscordCommand } from '@app/library/discord/discord-command';
import { Event } from '@app/library/discord/discord-decorators';
import { DiscordEvent } from '@app/library/discord/discord-event';
import { log } from '@app/library/utils';
import { Interaction, CacheType } from 'discord.js';

@Event('interactionCreate')
export class OnInteractionCreate implements DiscordEvent<'interactionCreate'> {

    public async execute(interaction: Interaction<CacheType>): Promise<any> {
        if (!interaction.isChatInputCommand()) return;

        let args: string[] = [ interaction.commandName ];
        const subcmd: string = interaction.options.getSubcommand(false);
        if (subcmd) args.push(subcmd);

        const command = (<DiscordBot>interaction.client).getCommand(...args).command;
        if (!command) return;
        
        args = [];
        for (let arg of command.args) {
            const result = arg.getValue(interaction.options);
            if (result.isBasic) args.push(result.value);
        }

        if (command.defer != DiscordCommand.DeferType.NO) {
            await interaction.deferReply({ ephemeral: command.defer == DiscordCommand.DeferType.EPHEMERAL });
        }

        try {
            const cmdResult = await command.execute(DiscordCommand.ExecuteArgs.create(interaction, args));
            if (cmdResult) log(cmdResult, 'Discord', 'debug');
        } catch (err) {
            const errorMsg = `💥 😵‍💫 Alguma coisa explodiu do nosso lado! Vamos esperar que não aconteça de novo!`;
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
            
            log(<any>err, 'Discord', 'err');
        }
    }

}