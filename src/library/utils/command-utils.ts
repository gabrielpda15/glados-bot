import { databaseService } from '@app/main';
import { Config } from '@app/models/configuration/config';
import { GuildMember } from 'discord.js';

async function clearUserRoles(target: GuildMember) {
    for (let role of target.roles.cache.values()) {
        if (role.id !== target.guild.roles.everyone.id)
            await target.roles.remove(role);
    }
}

async function getConfigs(): Promise<{ [key: string]: string }> {
    const repo = databaseService.getRepository(Config);
    const result = await repo.createQueryBuilder().getMany();
    return result.reduce((acc, cv) => {
        acc[cv.key] = cv.value;
        return acc;
    }, {} as { [key: string]: string });
}

export default { 
    clearUserRoles, 
    getConfigs 
};