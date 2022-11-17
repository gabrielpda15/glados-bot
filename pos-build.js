const { resolve } = require('path');
const { copyFileSync } = require('fs');

const filesToCopy = [ 
    { from: '.prod.env', to: '.env' },
    { from: 'bootstrap.js', to: 'bootstrap.js' },
    { from: 'package-prod.json', to: 'package.json' }
];

for (file of filesToCopy) {
    const fromPath = resolve(__dirname, file.from);
    const toPath = resolve(__dirname, 'build/', file.to);
    copyFileSync(fromPath, toPath);
}