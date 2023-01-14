import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'cfgActivity' })
export class Activity {
	@PrimaryGeneratedColumn('uuid')
	public id: string;

	@CreateDateColumn()
	public createdAt: Date;

	@UpdateDateColumn()
	public updatedAt: Date;

	@Column({ length: 80, unique: false, nullable: false })
	public description: string;
}
