import { Logger, QueryRunner } from 'typeorm';
import { log } from '../utils';

export class ConsoleLogger implements Logger {

    public logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): void {
        log(query, 'Typeorm: Query', 'info');
    }

    public logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner): void {
        log(typeof error === 'string' ? error : error.message, 'Typeorm: Log', 'err');
    }

    public logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner): void {
        log(query, 'Typeorm: QuerySlow', 'info');
    }

    public logSchemaBuild(message: string, queryRunner?: QueryRunner): void {
        log(message, 'Typeorm: Schema', 'info');
    }

    public logMigration(message: string, queryRunner?: QueryRunner): void {
        log(message, 'Typeorm: Migration', 'info');
    }

    public log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner): void {
        const severity = level == 'log' ? 'info' : (level == 'warn' ? 'warn' : level);
        log(message, 'Typeorm: Log', severity);
    }
    
}