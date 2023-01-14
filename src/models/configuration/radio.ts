import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'cfgRadio' })
export class Radio {
	@PrimaryGeneratedColumn('uuid')
	public id: string;

	@CreateDateColumn()
	public createdAt: Date;

	@UpdateDateColumn()
	public updatedAt: Date;

	@Column({ length: 32, nullable: false, unique: true })
	public key: string;

	@Column({ length: 128, nullable: false })
	public name: string;

	@Column({ length: 512, nullable: false, unique: false })
	public url: string;
}
