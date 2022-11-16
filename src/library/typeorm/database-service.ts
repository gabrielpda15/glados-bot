import { DataSource, DataSourceOptions, EntityTarget, QueryRunner, Repository } from 'typeorm';
import { resolve } from 'path';
import { ConsoleLogger } from './logger';

export class DatabaseService {

    private options: DataSourceOptions;
    private dataSource: DataSource;

    private constructor(options: DataSourceOptions) {
        this.options = options;
        this.dataSource = new DataSource(this.options);
    }

    public static create(): DatabaseService {
        return new DatabaseService({
            type: process.env.TYPEORM_CONNECTION as any,
            host: process.env.TYPEORM_HOST,
            username: process.env.TYPEORM_USERNAME,
            password: process.env.TYPEORM_PASSWORD,
            database: process.env.TYPEORM_DATABASE,
            port: +process.env.TYPEORM_PORT,
            synchronize: process.env.TYPEORM_SYNCHRONIZE == 'true',
            logging: process.env.TYPEORM_LOGGING == 'true',
            entities: [ resolve(__dirname, '../../..', process.env.TYPEORM_ENTITIES) ],
            migrations: [ resolve(__dirname, '../../..', process.env.TYPEORM_MIGRATIONS) ],
            subscribers: [ resolve(__dirname, '../../..', process.env.TYPEORM_SUBSCRIBERS) ],
            logger: new ConsoleLogger()
        });
    }

    public async initialize(): Promise<void> {
        if (!this.dataSource.isInitialized) await this.dataSource.initialize();
        // await this.dataSource.runMigrations();
    }

    public getRepository<Entity>(target: EntityTarget<Entity>): Repository<Entity> {
        return this.dataSource.getRepository(target);
    }

    public createQueryBuilder(queryRunner?: QueryRunner) {
        return this.dataSource.createQueryBuilder(queryRunner);
    }

}