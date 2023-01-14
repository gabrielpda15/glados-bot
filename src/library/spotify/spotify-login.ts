export class SpotifyLogin {
	public accessToken: string;
	public expiresIn: number;
	public refreshToken: string;
	public scope: string[];
	public tokenType: string;

	public createdAt: Date;

	constructor(obj?: any) {
		if (obj) {
			this.accessToken = obj['access_token'] ?? null;
			this.expiresIn = obj['expires_in'] ?? 0;
			this.refreshToken = obj['refresh_token'] ?? null;
			this.scope = obj['scope'] ?? [];
			this.tokenType = obj['token_type'] ?? null;
		}

		this.createdAt = new Date();
	}
}
