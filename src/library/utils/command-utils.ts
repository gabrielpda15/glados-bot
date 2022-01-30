import { Config } from '@app/models/configuration/config';
import { GuildMember } from 'discord.js';
import { DiscordBot } from '../discord/discord-bot';

async function clearUserRoles(target: GuildMember) {
    for (let role of target.roles.cache.values()) {
        if (role.id !== target.guild.roles.everyone.id)
            await target.roles.remove(role);
    }
}

async function getConfig(bot: DiscordBot): Promise<{ [key: string]: string }> {
    const connection = await bot.getDbConnection();
    const repo = connection.getRepository(Config);
    const result = await repo.createQueryBuilder().getMany();
    return result.reduce((acc, cv) => {
        acc[cv.key] = cv.value;
        return acc;
    }, {} as { [key: string]: string });
}

export default { 
    clearUserRoles, 
    getConfig 
};