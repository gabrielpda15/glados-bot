import {MigrationInterface, QueryRunner} from "typeorm";

export class initial1643574006811 implements MigrationInterface {
    name = 'initial1643574006811'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`cfgActivity\` (\`id\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`description\` varchar(80) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`cfgConfig\` (\`id\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`key\` varchar(32) NOT NULL, \`value\` varchar(256) NOT NULL, UNIQUE INDEX \`IDX_3fa6fc569aec0274f6ffcf26ad\` (\`key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_3fa6fc569aec0274f6ffcf26ad\` ON \`cfgConfig\``);
        await queryRunner.query(`DROP TABLE \`cfgConfig\``);
        await queryRunner.query(`DROP TABLE \`cfgActivity\``);
    }

}
