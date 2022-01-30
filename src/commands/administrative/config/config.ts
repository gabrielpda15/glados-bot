import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { PermissionResolvable, Permissions } from 'discord.js';
import { ConfigSet } from './config-set';

@Command({
    subcommands: [ ConfigSet ]
})
export class Config implements DiscordCommand {

    public name: string = 'Configuração';
    public description: string = 'Comando base de configuração das minhas variaveis!';
    public aliases: string[] = [ 'config' ];
    public usage: string[] = [ '', '<set|check>' ];
    public category: DiscordCommand.Category = DiscordCommand.Category.ADMINISTRATIVE;
    public permission: PermissionResolvable = Permissions.FLAGS.MANAGE_GUILD;
    public onlyOwner: boolean = false;
    public requiredArgs: number = 0;

    public async execute(e: DiscordCommand.ExecuteArgs): Promise<any> {
        console.log('Only Config!');
    }

}