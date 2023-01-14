import { request, RequestOptions } from 'https';
import { SpotifyLogin } from './spotify-login';

export class SpotifyApiHandler {
	public async getTrack({ trackId, authorization }: { trackId: string; authorization: SpotifyLogin }) {
		return await this.api({ path: '/tracks/' + trackId, method: 'GET', authorization });
	}

	private api<T>({
		path,
		method,
		authorization,
		body,
	}: {
		path: string;
		method: string;
		authorization: SpotifyLogin;
		body?: T;
	}): Promise<any> {
		return new Promise(async (res, rej) => {
			const data = body == null ? null : JSON.stringify(body);

			const options: RequestOptions = {
				host: 'api.spotify.com',
				path: '/v1' + path,
				method: method,
				headers: {
					Authorization: `${authorization.tokenType} ${authorization.accessToken}`,
				},
			};

			if (data != null) {
				options.headers['Content-Type'] = 'application/json';
				options.headers['Content-Length'] = Buffer.byteLength(data, 'utf8');
			}

			const req = request(options);

			req.on('response', (response) => {
				let data = '';
				response.setEncoding('utf8');
				response.on('error', (err) => rej(err));
				response.on('data', (chunk) => {
					data += chunk;
				});
				response.on('end', () => {
					if (response.statusCode >= 200 && response.statusCode <= 299) {
						if (response.statusCode == 204) res(null);
						try {
							res(JSON.parse(data.toString()));
						} catch {
							res(data.toString());
						}
					} else {
						rej({ statusCode: response.statusCode, data: data.toString() });
					}
				});
			});

			req.on('error', (err) => rej(err));

			if (data != null) {
				req.write(data, 'utf8');
			}

			req.end();
		});
	}
}
