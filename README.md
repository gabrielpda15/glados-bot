# GLaDOS Bot [![License](https://img.shields.io/github/license/gabrielpda15/glados-bot)](https://github.com/gabrielpda15/glados-bot/blob/main/LICENSE.md) [![Release](https://img.shields.io/github/release/gabrielpda15/glados-bot.svg?display_name=tag&include_prereleases)](https://github.com/gabrielpda15/glados-bot/releases/latest)

A simple music bot for discord servers using ytdl to get audio streams from Youtube.

## Building

To build the project you just need to run `yarn run build`. Remember to verify the `prod` versions of the `package.json` and `.env`, are up to date with the changes that you made to the `dev` ones.

## Environments

### Development

First you need to be sure to have [Node.js](https://nodejs.org/) version `18` or greater installed.
After installing [Node.js](https://nodejs.org/) run `corepack enabled` in your terminal, and after that run `yarn install`. This should install all dependencies and you should be ready to run `yarn start` to start the development environment.

### Production

You can just follow up the same steps as in [Development](https://github.com/gabrielpda15/glados-bot#development) and remember to edit the following files with your own personal data:
 - `.env`
 - `src/library/youtube/youtube.com_cookies.txt`

## Environment Variables

| Name | Type | Default | Description |
| ---- | :----: | ---- | ---- |
| NODE_ENV | string | development | The environment specification |
| DEBUG | boolean | true | Enables the debug type in logs |
| LOCALE | string | pt-BR | Not current been used |
| TOKEN | string |   | The token of your discord bot |
| PREFIX | string | g! | The command prefix of the bot |
| TYPEORM_CONNECTION | string | mysql | The type of the database, current just supports `mysql` and `sqlite` |
| TYPEORM_HOST | string | localhost | The host of your mysql database |
| TYPEORM_USERNAME | string | root | The username of your mysql database |
| TYPEORM_PASSWORD | string | toor | The password of your mysql database |
| TYPEORM_DATABASE | string | gladosbot | The database name, used by both `mysql` and `sqlite` connections |
| TYPEORM_PORT | number | 3306 | The port that your mysql is running on |
| TYPEORM_SYNCHRONIZE | boolean | false | If typeorm should always auto apply migrations on startup |
| TYPEORM_LOGGING | boolean | true | If typeorm logging is on |
| TYPEORM_ENTITIES | string | src/models/**/*.ts | Glob of files to be used as model |
| TYPEORM_ENTITIES_DIR | string | src/models | Folder where the entities is stored |
| TYPEORM_MIGRATIONS | string | src/migrations/**/*.ts | Glob of files to load migrations from |
| TYPEORM_MIGRATIONS_DIR | string | src/migrations | Folder where the migrations is stored |
| TYPEORM_SUBSCRIBERS | string | src/subscriber/**/*.ts | Glob of files to load subscribers from |
| TYPEORM_SUBSCRIBERS_DIR | string | src/subscriber | Folder where the subscribers is stored |