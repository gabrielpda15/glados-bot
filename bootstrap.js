const tsConfigPaths = require('tsconfig-paths');

const cleanup = tsConfigPaths.register({
    baseUrl: './',
    paths: {
        '@app/*': [ './*' ]
    }
});

process.on('SIGUSR2', () => { process.kill(process.pid, 'SIGUSR2'); cleanup(); });
process.on('SIGINT', () => { process.kill(process.pid, 'SIGINT'); cleanup(); });
