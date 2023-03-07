const glob = require("glob")
const fs = require('fs')
const path = require('path');

const files = glob.globSync('lib/esm/**/*.js');
for(let file of files) {
  if(!file.includes('migrationManager')) {
    const content = fs.readFileSync(path.join(__dirname, file)).toString('utf-8');
    fs.writeFileSync(path.join(__dirname, file), content.replaceAll('.js', '.mjs'));
  }
  fs.renameSync(path.join(__dirname, file), path.join(__dirname, file.replace('.js', '.mjs')));
}

fs.copyFileSync(path.join(__dirname, 'src/init-migration.js'), path.join(__dirname, 'lib/init-migration.js'));
fs.copyFileSync(path.join(__dirname, 'src/migration-template.js'), path.join(__dirname, 'lib/migration-template.js'));