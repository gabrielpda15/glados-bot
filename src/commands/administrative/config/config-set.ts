import { DiscordCommand } from '@app/library/discord/discord-command';
import { PermissionResolvable, Permissions } from 'discord.js';

export class ConfigSet implements DiscordCommand {

    public name: string = 'Definir configuração';
    public description: string = 'Define o valor de uma de minhas variaveis!';
    public aliases: string[] = [ 'set' ];
    public usage: string[] = [ '<chave> <valor>' ];
    public category: DiscordCommand.Category = DiscordCommand.Category.ADMINISTRATIVE;
    public permission: PermissionResolvable = Permissions.FLAGS.MANAGE_GUILD;
    public onlyOwner: boolean = false;
    public requiredArgs: number = 2;

    public async execute(e: DiscordCommand.ExecuteArgs): Promise<any> {
        console.log('Config Set!');
    }

}