import { args } from '@app/main';
import { createAudioResource, StreamType } from '@discordjs/voice';
import { getDevices, DeviceInfo } from 'naudiodon';
import { Microphone } from './microphone.service';

export class HostAudioService {
	private mic: Microphone;
	private selectedDevice: DeviceInfo = null;

	private constructor() {}

	public static create() {
		const service = new HostAudioService();

		let device = args.get('device');
		if (typeof device === 'string' && device.length > 0) {
			device = device.toLowerCase().trim();
			service.selectedDevice = getDevices().find((value) => {
				const deviceName = value.name.toLowerCase().trim();
				return deviceName.includes(device as string);
			});
		}

		service.mic = new Microphone({
			bitwidth: 16,
			channels: 2,
			rate: 44100,
			device: <any>service.selectedDevice?.name,
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
