import { DiscordCommand } from '@app/library/discord/discord-command';
import { Command } from '@app/library/discord/discord-decorators';
import { sleep } from '@app/library/utils';
import { PermissionsString } from 'discord.js';

@Command()
export class Role implements DiscordCommand {
	public name: string = 'Role';
	public description: string = 'Meu ovo esquerdo';
	public aliases: string[] = ['role'];
	public usage: string[] = ['<role>'];
	public category: DiscordCommand.Category = DiscordCommand.Category.ADMINISTRATIVE;
	public permission: PermissionsString = 'Administrator';
	public onlyOwner: boolean = false;
	public defer: DiscordCommand.DeferType = DiscordCommand.DeferType.NO;
	public requiredArgs: number = 1;
	public args: DiscordCommand.Argument[] = [
        new DiscordCommand.Argument('Role', 'cargo', 'Menção do cargo', true),
    ];

	public async execute(e: DiscordCommand.MessageExecuteArgs | DiscordCommand.InteractionExecuteArgs): Promise<any> {
		if (e.isInteraction()) {            
            await e.reply('Bora de celta então?!', false);
            const role = e.input.options.getRole('cargo');

            const members = await e.input.guild.members.fetch({ limit: 2000 });
            const noRoleMember = members.filter(m => !m.roles.cache.get(role.id));

            await e.reply(`Achei uns malacabado sem cargo! ${noRoleMember.size} para ser exato!`, false);
            await sleep(1000);

            for (let index = 0; index < noRoleMember.size; index += 50) {
                const promises = noRoleMember.map(member => e.input.guild.members.addRole({
                    user: member.id,
                    role: role.id
                }));

                await Promise.all(promises);
                await e.reply(`${index + 1} de ${noRoleMember.size}`, false);
            }
            
            await e.reply('Pronto lindão!');
        }        
	}
}
