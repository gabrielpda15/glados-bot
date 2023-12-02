import { request, RequestOptions } from 'https';
import { v4 as uuid } from 'uuid';
import { queriefy } from '../utils';
import { SpotifyLogin } from './spotify-login';
import { writeFileSync as fsWriteFile, readFileSync as fsReadFile } from 'fs';
import { resolve as pathResolve } from 'path';

const defaultScopes = ['user-read-currently-playing', 'user-modify-playback-state'];
const callback = `http://localhost:${process.env.PORT ?? 8888}/callback`;
const secretsPath = pathResolve(__dirname, '../../../.secrets');

export class SpotifyAuthHandler {
	private state: string;
	private token: SpotifyLogin;

	public async loginFromSecrets() {
		const file = fsReadFile(secretsPath, { encoding: 'utf-8' });		
		const obj = JSON.parse(file);

		this.token = new SpotifyLogin();
		this.token.accessToken = obj['accessToken'] ?? null;
		this.token.expiresIn = obj['expiresIn'] ?? 0;
		this.token.refreshToken = obj['refreshToken'] ?? null;
		this.token.scope = obj['scope'] ?? [];
		this.token.tokenType = obj['tokenType'] ?? null;

		await this.refreshToken();
	}

	public async loginCallback(code: string, state: string, scope: string[] = defaultScopes) {
		return new Promise<any>((res, rej) => {
			try {
				if (state != this.state) rej('O state retornado não corresponde ao enviado!');

				const auth = Buffer.from(`${process.env.SPOTIFY_CLIENT}:${process.env.SPOTIFY_SECRET}`);
				const data = queriefy({
					code: code,
					grant_type: 'authorization_code',
					redirect_uri: callback,
				});

				const options: RequestOptions = {
					host: 'accounts.spotify.com',
					path: '/api/token',
					method: 'POST',
					headers: {
						'Authorization': 'Basic ' + auth.toString('base64'),
						'Content-Length': Buffer.byteLength(data, 'utf8'),
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				};

				const req = request(options);

				req.on('response', (response) => {
					response.on('error', (err) => {
						rej(err);
					});
					response.on('data', (data: Buffer) => {
						if (response.statusCode == 200) {
							this.token = new SpotifyLogin(JSON.parse(data.toString()));
							this.updateSecrets();
							res({ statusCode: response.statusCode, data: JSON.parse(data.toString()) });
						} else {
							rej({ statusCode: response.statusCode, data: data.toString() });
						}
					});
				});

				req.write(data, 'utf8');
				req.end();
			} catch (err) {
				rej(err);
			}
		});
	}

	private refreshToken(): Promise<void> {
		return new Promise<any>((res, rej) => {
			try {
				const auth = Buffer.from(`${process.env.SPOTIFY_CLIENT}:${process.env.SPOTIFY_SECRET}`);
				const data = queriefy({
					grant_type: 'refresh_token',
					refresh_token: this.token.refreshToken,
				});

				const options: RequestOptions = {
					host: 'accounts.spotify.com',
					path: '/api/token',
					method: 'POST',
					headers: {
						'Authorization': 'Basic ' + auth.toString('base64'),
						'Content-Length': Buffer.byteLength(data, 'utf8'),
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				};

				const req = request(options);

				req.on('response', (response) => {
					response.on('error', (err) => {
						rej(err);
					});
					response.on('data', (data: Buffer) => {
						if (response.statusCode == 200) {
							const result = JSON.parse(data.toString());
							result['refresh_token'] = this.token.refreshToken;
							this.token = new SpotifyLogin(result);
							this.updateSecrets();
							res({ statusCode: response.statusCode, data: result });
						} else {
							rej({ statusCode: response.statusCode, data: data.toString() });
						}
					});
				});

				req.write(data, 'utf8');
				req.end();
			} catch (err) {
				rej(err);
			}
		});
	}

	private updateSecrets() {
		fsWriteFile(secretsPath, JSON.stringify(this.token, null, 4), { encoding: 'utf-8' });
	}

	public async getAuthorization(): Promise<SpotifyLogin> {
		return new Promise<SpotifyLogin>(async (res, rej) => {
			try {
				const expiresAt = this.token.createdAt.getTime() + this.token.expiresIn * 1000;

				if (this.token.accessToken == null || expiresAt < new Date().getTime()) {
					await this.refreshToken();
				}

				res(this.token);
			} catch (err) {
				rej(err);
			}
		});
	}
}
