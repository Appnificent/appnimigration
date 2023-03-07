const glob = require("glob")
const fs = require('fs')
const path = require('path');

const files = glob.globSync('lib/esm/**/*.js');
for(let file of files) {
  fs.renameSync(path.join(__dirname, file), path.join(__dirname, file.replace('.js', '.mjs')));
}

const content = fs.readFileSync(path.join(__dirname, 'lib/esm/index.mjs')).toString('utf-8');
fs.writeFileSync(path.join(__dirname, 'lib/esm/index.mjs'), content.replaceAll('.js', '.mjs'));

// fs.copyFileSync(path.join(__dirname, 'src/init-migration.js'), path.join(__dirname, 'lib/init-migration.js'));
// fs.copyFileSync(path.join(__dirname, 'src/migration-template.js'), path.join(__dirname, 'lib/migration-template.js'));