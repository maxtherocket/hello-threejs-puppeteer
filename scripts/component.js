/**
 * Script to create new vue components and sections.
 * @arg ComponentName - required
 * @arg ComponentDirectory - optional
 * To create a COMPONENT: yarn run component ComponentName ComponentDirectoryName
 * or yarn run component ComponentName
 * To create a SECTION: yarn run component ComponentName ComponentDirectoryName --section
 * or yarn run component ComponentName --section
 * NOTE: If you omit ComponentDirectoryName, the directory name for the component will default to
 *   ComponentName
 */
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const maxstache = require('maxstache');
const chalk = require('chalk');
const changeCase = require('change-case');
const argv = require('minimist')(process.argv.slice(2), {
  boolean : [ '--page' ]
});

const TYPE = argv.page ? 'page' : 'component';
const COMPONENTS_FOLDER = argv.page ? '../src/pages/' : '../src/components/';

async function write(name, dir) {
  try {
    const made = await mkdirp(dir);
    // console.log(chalk.greenBright(`Made directories, starting with ${made}`));

    await Promise.all([
      template(
        path.resolve(__dirname, 'templates/' + TYPE + '/Component.vue'),
        // path.resolve(dir, `${name}.vue`)
        path.resolve(dir, `${TYPE === 'component' ? name : 'index'}.vue`)
      )
    ])
    console.log(chalk.greenBright(`Created new ${name} ${TYPE} at ${dir}`));
  }
  catch (error) {
    // console.error('write error:', error.message);
    console.error(chalk.redBright('Write error', error))
  }
}

function template(input, output) {
  const data = {
    pascal : changeCase.pascalCase(name),
    param : changeCase.paramCase(name),
    title : changeCase.capitalCase(name),
    depth : targetFolder ? '../' : ''
  };
  return new Promise((resolve, reject) => {
    fs.readFile(input, 'utf8', (err, str) => {
      if (err) {
        return reject(err);
      }
      str = maxstache(str, data);
      fs.writeFile(output, str, err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

let name = argv._[0];
if (!name) {
  console.error(chalk.red(`Error: Must give a ${TYPE} name to create.`));
  process.exit(0);
}

name = changeCase.pascalCase(name);

let targetFolder = argv._[1] ? argv._[1] : argv._[0];
targetFolder = targetFolder ?
  (argv.page ?
    `${changeCase.paramCase(targetFolder)}/` :
    `${changeCase.pascalCase(targetFolder)}/`
  ) :
  '';

const cwd = process.cwd();
const dir = path.resolve(__dirname, [ COMPONENTS_FOLDER, targetFolder ].join(''));

fs.stat(dir, async (err, stat) => {
  if (err) {
    await write(name, dir);
  }
  else {
    console.log(chalk.red(`Path at ${path.relative(cwd, dir)} already exists!`));
  }
});
