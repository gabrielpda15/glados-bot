import { request, RequestOptions } from 'https';
import { queriefy } from '../utils';
import { SpotifyLogin } from './spotify-login';
import { SpotifyPlaylist, SpotifyTrack } from './spotify.service';

export class SpotifyApiHandler {
	public async getTrack({ trackId, authorization }: { trackId: string; authorization: SpotifyLogin }): Promise<SpotifyTrack> {
		const result = await this.api({ path: `/tracks/${trackId}`, method: 'GET', authorization });
		return {
			id: trackId,
			title: result['name'],
			length: Math.round((result['duration_ms'] ?? 0) / 1000),
			url: `https://open.spotify.com/track/${trackId}`,
			artist: {
				name: result['artists']?.[0]?.['name'],
				url: result['artists']?.[0]?.['external_urls']?.['spotify']
			}
		}
	}

	public async getPlaylist({ playlistId, authorization }: { playlistId: string; authorization: SpotifyLogin }): Promise<SpotifyPlaylist> {
		return await this.recurssiveGetPlaylist({
			playlistId,
			authorization,
		});
	}

	private async recurssiveGetPlaylist({
		playlistId,
		authorization,
		playlist,
	}: {
		playlistId: string;
		authorization: SpotifyLogin;
		playlist?: SpotifyPlaylist & { next: string };
	}): Promise<SpotifyPlaylist> {
		const url = playlist?.next?.split?.('/v1')?.[1] ?? `/playlists/${playlistId}`;
		const result = await this.api({ path: url, method: 'GET', authorization });

		const playlistItems = result['tracks']?.['items'] ?? result['items'] ?? [];
		const data = {
			playlistId,
			authorization,
			playlist: {
				id: playlist?.id ?? result['id'],
				title: playlist?.title ?? result['name'],
				length: 0,
				url: playlist?.url ?? result['external_urls']?.['spotify'],
				next: result['tracks']?.['next'] ?? result['next'],
				items: [
					...(playlist?.items ?? []),
					...playlistItems.map((item: any) => ({
						id: item['track']?.['id'],
						title: item['track']?.['name'],
						length: Math.round((item['track']?.['duration_ms'] ?? 0) / 1000),
						url: item['track']?.['external_urls']?.['spotify'],
						artist: { 
							name: item['track']?.['artists']?.[0]?.['name'],
							url: item['track']?.['artists']?.[0]?.['external_urls']?.['spotify']
						}
					}))
				]
			}
		}

		if (data.playlist.next) {
			return await this.recurssiveGetPlaylist(data);
		}

		return {
			...data.playlist,
			length: data.playlist.items.length
		};
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
