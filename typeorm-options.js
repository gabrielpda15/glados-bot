import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';

config({ path: '.env' });

const options = {
    type: process.env.TYPEORM_CONNECTION,
    host: process.env.TYPEORM_HOST,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    port: +process.env.TYPEORM_PORT,
    synchronize: process.env.TYPEORM_SYNCHRONIZE == 'true',
    logging: process.env.TYPEORM_LOGGING == 'true',
    entities: [resolve(__dirname, process.env.TYPEORM_ENTITIES)],
    migrations: [resolve(__dirname, process.env.TYPEORM_MIGRATIONS)],
    subscribers: [resolve(__dirname, process.env.TYPEORM_SUBSCRIBERS)],
    cli: {
        entitiesDir: resolve(__dirname, process.env.TYPEORM_ENTITIES_DIR),
        migrationsDir: resolve(__dirname, process.env.TYPEORM_MIGRATIONS_DIR),
        subscribersDir: resolve(__dirname, process.env.TYPEORM_SUBSCRIBERS_DIR)
    }
}

export default new DataSource(options);