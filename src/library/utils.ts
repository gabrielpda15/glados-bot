import base from './utils/base-utils';
import discord from './utils/discord-utils';
import commands from './utils/command-utils';

const utilsModule = {
    ...base,
    ...discord,
    ...commands
};

export = utilsModule;