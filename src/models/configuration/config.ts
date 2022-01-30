import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'cfgConfig' })
export class Config {

    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

    @Column({ length: 32, nullable: false, unique: true })
    public key: string;

    @Column({ length: 256, nullable: false, unique: false })
    public value: string;

}