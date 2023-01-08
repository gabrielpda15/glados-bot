import EventEmitter from 'events';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { type } from 'os';
import { Readable } from 'stream';

type OS = 'win' | 'mac' | 'linux'

interface MicrophoneOptions {
    endian?: 'big' | 'little' | undefined;
    bitwidth?: 8 | 16 | 24 | undefined;
    encoding?: 'signed-integer' | 'unsigned-integer' | undefined;
    rate?: 8000 | 16000 | 44100 | undefined;
    channels?: 1 | 2 | undefined;
    device?: 'hw:0,0' | 'plughw:1,0' | 'default' | undefined;
    additionalParameters?: any;
}

export class Microphone extends EventEmitter {

    private os: OS;
    private process: ChildProcessWithoutNullStreams;

    private endian: 'little' | 'big';
    private bitwidth: 8 | 16 | 24;
    private encoding: 'signed-integer' | 'unsigned-integer';
    private rate: 8000 | 16000 | 44100;
    private channels: 1 | 2;
    private device: 'hw:0,0' | 'plughw:1,0' | 'default';
    private additionalParameters: any;

    private format: string;
    private formatEndian: 'BE' | 'LE';
    private formatEncoding: 'S' | 'U';

    constructor(options: MicrophoneOptions) {
        super();

        this.os = 'linux';
        if (type() === 'Darwin') this.os = 'mac';
        if (type().indexOf('Windows') > -1) this.os = 'win';

        options = options || {};
        this.endian = options.endian || 'little';
        this.bitwidth = options.bitwidth || 16;
        this.encoding = options.encoding || 'signed-integer';
        this.rate = options.rate || 16000;
        this.channels = options.channels || 1;
        this.additionalParameters = options.additionalParameters || false;

        if (this.os === 'win') {
            this.device = options.device || 'default';
        }

        if (this.os === 'linux') {
            this.device = options.device || 'plughw:1,0';

            this.formatEncoding = this.encoding === 'unsigned-integer' ? 'U' : 'S';
            this.formatEndian = this.endian === 'big' ? 'BE' : 'LE';
            this.format = this.formatEncoding + this.bitwidth + '_' + this.formatEndian;
        }
    }

    public startRecording(): Readable {
        if (!this.process) {
            
            const getAudioOptions = {
                'win': () => [
                    '-b', this.bitwidth, 
                    '--endian', this.endian, 
                    '-c', this.channels, 
                    '-r', this.rate, 
                    '-e', this.encoding, 
                    '-t', 'waveaudio', 
                    this.device, '-p'
                ],
                'mac': () => [
                    '-q', 
                    '-b', this.bitwidth, 
                    '-c', this.channels, 
                    '-r', this.rate, 
                    '-e', this.encoding, 
                    '-t', 'wav', '-'
                ],
                'linux': () => [
                    '-c', this.channels, 
                    '-r', this.rate, 
                    '-f', this.format, 
                    '-D', this.device
                ]
            }

            let audioOptions = getAudioOptions[this.os]();

            if (this.additionalParameters) {
                audioOptions = audioOptions.concat(this.additionalParameters);
            }

            const getProcess = {
                'win': (o: any) => spawn('D:\\Programas\\Sox\\sox.exe', o),
                'mac': (o: any) => spawn('rec', o),
                'linux': (o: any) => spawn('arecord', o),
            }

           this.process = getProcess[this.os](audioOptions);
           this.process.on('error', (err) => this.emit('error', err));
           this.process.stderr.on('error', (err) => this.emit('error', err));
           this.process.stderr.on('data', (data) => this.emit('data', data));

           return this.process.stdout;
        }
    }

    public stopRecording(): void {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }
}
