import { Event } from '@app/library/discord/discord-decorators';
import { DiscordEvent } from '@app/library/discord/discord-event';
import { log } from '@app/library/utils';

@Event('debug')
export class OnDebug implements DiscordEvent<'debug'> {

    public async execute(message: string): Promise<any> {
        if (process.env.DEBUG == 'true') log(message, 'Discord', 'info')
    }

}