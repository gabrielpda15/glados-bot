import g from 'glob';
import dotenv from 'dotenv';
import { join, normalize, resolve } from 'path';
import { existsSync, copyFileSync } from 'fs';
import { Arguments } from '../types';

const urlRegexNonHttp =
	/(https?:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
const urlRegex =
	/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
const dateRegex =
	/^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})( ([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]))?$|^(?:29(\/|-|\.)0?2\7(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))( ([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]))?$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\12(?:(?:1[6-9]|[2-9]\d)?\d{2})( ([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]))?$/;

function getRandom(min: number, max: number): number {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomString(
	length: number,
	chars: string = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789'
): string {
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars[getRandom(0, chars.length - 1)];
	}
	return result;
}

function shuffleArray<T>(array: T[]): T[] {
	let currentIndex = array.length,
		randomIndex;

	while (currentIndex != 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}

function isValidUrl(url: string): boolean {
	return urlRegex.test(url);
}

function containsUrl(message: string): boolean {
	return urlRegexNonHttp.test(message);
}

function validateDate(value: string): Date {
	if (!dateRegex.test(value)) return null;

	const splitedValue = value.split(' ');
	const dateComponents = splitedValue[0].split(/\/|-|\./);
	const tempDate = new Date(+dateComponents[2], +dateComponents[1], +dateComponents[0]);

	if (splitedValue.length == 2) {
		const hourComponents = splitedValue[1].split(':');
		tempDate.setHours(+hourComponents[0], +hourComponents[1], +hourComponents[2]);
	}

	return tempDate;
}

function sleep(ms: number): Promise<void> {
	return new Promise((res) => setTimeout(res, ms));
}

function findSimilarStrings(list: string[], search: string, take?: number, prioritizeFirstLetter?: boolean): string[] {
	const searchArray = [...search];
	if (prioritizeFirstLetter === true) searchArray.splice(0, 1);

	let result = list.map((x) => x);
	if (prioritizeFirstLetter === true) result = result.filter((x) => x.startsWith(search[0]));
	result = result.sort((a, b) => {
		const countA = countCommonLetters(a, searchArray.join(''));
		const countB = countCommonLetters(b, searchArray.join(''));
		return countB - countA;
	});

	return result.splice(0, take ?? 3);
}

function countCommonLetters(a: string, b: string): number {
	return [...a]
		.filter((i, p, s) => s.indexOf(i) == p)
		.reduce((pv, cv) => {
			if (b.includes(cv)) return pv + 1;
			return pv;
		}, 0);
}

function groupBy<T, V>(
	values: T[],
	keySelector: (item: T) => string,
	valueSelector: (item: T) => V
): { [key: string]: V[] } {
	const result: { [key: string]: V[] } = {};

	for (let item of values) {
		const key = keySelector(item);
		const value = valueSelector(item);
		result[key] ??= [];
		result[key].push(value);
	}

	return result;
}

enum ConsoleFormats {
	Reset = '\x1b[0m',
	Bright = '\x1b[1m',
	Dim = '\x1b[2m',
	Underscore = '\x1b[4m',
	Blink = '\x1b[5m',
	Reverse = '\x1b[7m',
	Hidden = '\x1b[8m',

	FgBlack = '\x1b[30m',
	FgRed = '\x1b[31m',
	FgGreen = '\x1b[32m',
	FgYellow = '\x1b[33m',
	FgBlue = '\x1b[34m',
	FgMagenta = '\x1b[35m',
	FgCyan = '\x1b[36m',
	FgWhite = '\x1b[37m',

	BgBlack = '\x1b[40m',
	BgRed = '\x1b[41m',
	BgGreen = '\x1b[42m',
	BgYellow = '\x1b[43m',
	BgBlue = '\x1b[44m',
	BgMagenta = '\x1b[45m',
	BgCyan = '\x1b[46m',
	BgWhite = '\x1b[47m',
}

type ConsoleSeverity = 'err' | 'info' | 'warn' | 'debug' | 'succ' | 'trace';

function log<T>(message: T, source: string, severity: ConsoleSeverity): void {
	if (severity === 'debug' && process.env.DEBUG != 'true') return;

	let severityString: string = severity == 'succ' ? 'info' : severity;
	severityString = severity.padStart(5).toUpperCase();

	const messageConverter: { [key: string]: () => string } = {
		'string': () => message as string,
		'number': () => message.toString(),
		'bigint': () => message.toString(),
		'boolean': () => message === true ? 'true' : 'false',
		'function': () => message.toString(),
		'object': () => JSON.stringify(message),
		'symbol': () => message.toString(),
		'undefined': () => 'undefined'
	}

	let result = `[${new Date().toLocaleString(process.env.LOCALE)}] `;
	result += `[${source}] `;
	result += `${severityString}: `;
	result += ` ${messageConverter[typeof message]()}`;

	let colors: { [key: string]: string } = {
		info: ConsoleFormats.FgWhite,
		succ: ConsoleFormats.FgGreen,
		warn: ConsoleFormats.FgYellow,
		err: ConsoleFormats.Bright + ConsoleFormats.FgRed,
		debug: ConsoleFormats.Bright + ConsoleFormats.FgBlack,
		trace: ConsoleFormats.FgRed,
	};

	const color = colors[severity] + '%s' + ConsoleFormats.Reset;

	console.log(color, result);
}

function config(): Arguments {
	const path = resolve(__dirname, '../../../');
	if (!existsSync(resolve(path, '.env'))) {
		log('No .env files were found! Creating one...', 'System', 'warn');
		copyFileSync(resolve(path, '.default.env'), resolve(path, '.env'));
		log('Please edit the .env with your own stuff!', 'System', 'warn');
		return null;
	}

	dotenv.config({ path: '.env' });

	const args = Arguments.create(process.argv);
	return args;
}

function queriefy(obj: { [key: string]: any }): string {
	let query = '';
	for (let key in obj) {
		query += `${key}=${encodeURI(obj[key])}&`;
	}
	return query.slice(0, -1);
}

function normalizeGlob(matches: string[]) {
	matches = matches.map((x) => resolve(__dirname, '../../../', x));
	matches = matches.map((x) => normalize(x));
	return matches;
}

function glob(pattern: string, debug: boolean = false): Promise<string[]> {
	return new Promise((res, rej) => {
		pattern = join('src', pattern).replace(/\\/g, '/');
		g(pattern, { debug: debug }, (err, matches) => {
			if (err) rej(err);
			res(normalizeGlob(matches));
		});
	});
}

export default {
	getRandom,
	getRandomString,
	shuffleArray,
	isValidUrl,
	containsUrl,
	validateDate,
	sleep,
	findSimilarStrings,
	countCommonLetters,
	groupBy,
	log,
	config,
	queriefy,
	glob,
};
