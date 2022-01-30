import { Activity } from '@app/models/configuration/activity';
import * as discord from 'discord.js';
import { DiscordBot } from '../discord/discord-bot';
import base from './base-utils';

const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

function getIntents(): number {
    let intents: number = null;

    for (let item in discord.Intents.FLAGS) {
        if (item != 'GUILD_PRESENCES' && item != 'GUILD_MEMBERS') {
            if (intents == null) intents = discord.Intents.FLAGS[<discord.IntentsString>item];
            else intents = intents | discord.Intents.FLAGS[<discord.IntentsString>item];
        }
    }

    return intents;
}

function createEmbed(title?: string, desc?: string) {
    let embed = new discord.MessageEmbed();
    if (title) embed = embed.setTitle(title);
    if (desc) embed = embed.setDescription(desc);

    let colors = ['#00B02F', '#2800C9', '#BF0C00', '#A400C9', '#DB7900', '#FFEE00'];
    let rndIndex = base.getRandom(0, colors.length - 1);

    embed.setColor(colors[rndIndex] as any);

    return embed;
}

async function startActivityLoop(bot: DiscordBot, delay: number = 10000) {
    const connection = await bot.getDbConnection();
    const repo =  connection.getRepository(Activity);
    const activities = await repo.createQueryBuilder().getMany();
    if (activities.length > 0) activityLoop(bot, activities.map(x => x.description), 0, delay);
}

function activityLoop(bot: DiscordBot, activities: string[], n: number, delay: number) {
    let x = n;
    if (bot.user) bot.user.setActivity(activities[x++]);
    if (x >= activities.length) x = 0;
    setTimeout(() => activityLoop(bot, activities, x, delay), delay);
}

function getCommandArguments(args: string): string[] {
    const regex = /("(\\"|[^"])+"|[^\s"]+)/g;
    const match = args.match(regex);
    return match.map(x => {
        if (x.startsWith('"') && x.endsWith('"')) return x.substr(1, x.length - 2);
        return x;
    });
}

export default { 
    getIntents, 
    createEmbed, 
    startActivityLoop,
    getCommandArguments
};