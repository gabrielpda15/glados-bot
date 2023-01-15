import express, { NextFunction, Request, Response } from 'express';
import { json } from 'body-parser';
import { spotifyService } from '@app/main';
import { log } from '../utils';
import { resolve as pathResolve } from 'path';

export class WebService {
	private app: express.Express;

	private constructor() {
		this.app = express();
	}

	public static create(): WebService {
		return new WebService();
	}

	public async initialize(): Promise<void> {
		this.initializeRouting();
	}

	public start(): void {
		this.app.listen(process.env.PORT ?? 8888);
	}

	private initializeRouting() {
		this.app.use(json());
		this.app.get('/callback', (req, res, next) => this.onCallback(req, res, next));
	}

	private async onCallback(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await spotifyService.auth.loginCallback(<string>req.query.code, <string>req.query.state);
			if (result.statusCode == 200) {
				log('Successfuly logged in spotify api!', 'Web Service', 'info');
				res.sendFile(pathResolve(__dirname, '../../www/auto-close.html'));
			} else {
				log('Something went wrong with Spotify Login!', 'Web Service', 'err');
				res.sendStatus(400);
			}
		} catch (e) {
			try {
				log(JSON.stringify(e), 'Web Service', 'err');
			} catch {
				log(e, 'Web Service', 'err');
			}
		}
	}
}
