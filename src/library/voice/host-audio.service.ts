import { args } from '@app/main';
import { createAudioResource, StreamType } from '@discordjs/voice';
import { Microphone } from './microphone.service';

export class HostAudioService {
	private mic: Microphone;

	private constructor() {}

	public static create() {
		const service = new HostAudioService();

		const device = args?.get('device')?.toString?.()?.toLowerCase().trim();

		service.mic = new Microphone({
			bitwidth: 16,
			channels: 2,
			rate: 44100,
			device: device as any,
		});

		return service;
	}

	public async initialize(): Promise<void> {}

	public getStream() {
		return createAudioResource(this.mic.startRecording(), {
			inputType: StreamType.Arbitrary,
			inlineVolume: true,
		});
	}

	public async disposeStream(): Promise<void> {
		this.mic.stopRecording();
	}
}
