import { databaseService } from '@app/main';
import { Radio } from '@app/models/configuration/radio';
import { AudioResource, createAudioResource, StreamType } from '@discordjs/voice';
import { DeepPartial } from 'typeorm';

export class RadioService {
	private static readonly INITIAL_VOLUME: number = 0.1;
	private static readonly INITIAL_RADIOS: DeepPartial<Radio>[] = [
		{
			key: 'veronica',
			name: 'Veronica Rock Radio',
			url: 'https://25353.live.streamtheworld.com/SRGSTR11.mp3',
		},
	];

	private constructor() {}

	public static create(): RadioService {
		return new RadioService();
	}

	public async initialize(): Promise<void> {
		const repo = databaseService.getRepository(Radio);
		const curRadios = await repo.createQueryBuilder().getMany();
		if (curRadios.length == 0) {
			await repo.insert(RadioService.INITIAL_RADIOS);
		}
	}

	public async getStream(radioUrl: string, volume: number = 100): Promise<AudioResource> {
		const resource = createAudioResource(radioUrl, {
			inputType: StreamType.Arbitrary,
			inlineVolume: true,
		});

		resource.volume.setVolume(RadioService.INITIAL_VOLUME * (volume / 100));

		return resource;
	}
}
