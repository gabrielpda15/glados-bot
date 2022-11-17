import { Logger, QueryRunner } from 'typeorm';
import { log } from '../utils';

export class ConsoleLogger implements Logger {

    public logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): void {
        log(query, 'Typeorm: Query', 'debug');
    }

    public logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner): void {
        log(typeof error === 'string' ? error : error.message, 'Typeorm: Log', 'err');
    }

    public logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner): void {
        log(query, 'Typeorm: QuerySlow', 'debug');
    }

    public logSchemaBuild(message: string, queryRunner?: QueryRunner): void {
        log(message, 'Typeorm: Schema', 'debug');
    }

    public logMigration(message: string, queryRunner?: QueryRunner): void {
        log(message, 'Typeorm: Migration', 'debug');
    }

    public log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner): void {
        const severity = level == 'log' ? 'debug' : (level == 'warn' ? 'warn' : level);
        log(message, 'Typeorm: Log', severity);
    }
    
}