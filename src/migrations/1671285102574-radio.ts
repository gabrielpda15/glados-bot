import { MigrationInterface, QueryRunner } from "typeorm";

export class radio1671285102574 implements MigrationInterface {
    name = 'radio1671285102574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`cfgRadio\` (
                \`id\` varchar(36) NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`key\` varchar(32) NOT NULL,
                \`name\` varchar(128) NOT NULL,
                \`url\` varchar(512) NOT NULL,
                UNIQUE INDEX \`IDX_476ab2cd22e6834af96e04b670\` (\`key\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX \`IDX_476ab2cd22e6834af96e04b670\` ON \`cfgRadio\`
        `);
        await queryRunner.query(`
            DROP TABLE \`cfgRadio\`
        `);
    }

}
