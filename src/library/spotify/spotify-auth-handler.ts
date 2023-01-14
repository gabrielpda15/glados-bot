import { request, RequestOptions } from 'https';
import { v4 as uuid } from 'uuid';
import { queriefy } from '../utils';
import { SpotifyLogin } from './spotify-login';

const defaultScopes = ['user-read-currently-playing', 'user-modify-playback-state'];
const callback = 'http://localhost:8888/callback';

export class SpotifyAuthHandler {
	private state: string;
	private token: SpotifyLogin;

	public login(scope: string[] = defaultScopes): Promise<any> {
		return new Promise<void>(async (res, rej) => {
			try {
				this.state = uuid();

				let url = 'https://accounts.spotify.com/authorize?';
				url += `client_id=${process.env.SPOTIFY_CLIENT}&`;
				url += `redirect_uri=${encodeURI(callback)}&`;
				url += `response_type=code&`;
				url += `scope=${encodeURI(scope.join(' '))}&`;
				url += `state=${encodeURI(this.state)}`;

				const cp = await import('child_process');
				const prs = cp.exec(`start "" "${url}"`);

				prs.once('spawn', () => res());
				prs.once('error', (err) => rej(err));
			} catch (err) {
				rej(err);
			}
		});
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
