import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { log } from '../utils';

export type Cookie = {
    domain: string;
    includeSubdomains: boolean;
    path: string;
    secure: boolean;
    expiry: Date;
    name: string;
    value: string;
}

export class YoutubeCookie {

    private list: Cookie[];

    private constructor() { 
        this.list = [];
    }

    public static async create(path: string): Promise<YoutubeCookie> {
        const instance = new YoutubeCookie();

        path = resolve(__dirname, path);

        if (!existsSync(path)) {
            writeFileSync(path, '', { encoding: 'utf8' });
            log('Created youtube cookies file, please replace it with your own!', 'Youtube', 'warn');
            return;
        }

        const content: string = readFileSync(path, { encoding: 'utf8' });
        const lines = content.match(/^[^#\s](.*)$/gm);

        for (let line of lines) {
            const values = line.split('\t');
            if (values.length == 7) {
                instance.list.push({
                    domain: values[0],
                    includeSubdomains: values[1] == 'TRUE',
                    path: values[2],
                    secure: values[3] == 'TRUE',
                    expiry: new Date(+values[4] * 1000),
                    name: values[5],
                    value: values[6]
                });
            }
        }

        return instance;
    }

    public toString(): string {
        let result = '';
        for (let cookie of this.list) {
            result += `${cookie.name}=${cookie.value}`;
            result += `; `;
        }
        return result.slice(0, -2);
    }

}