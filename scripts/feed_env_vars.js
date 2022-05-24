const fs = require('fs');
const FILE_PATH_JSON = '.env.json';

const ENV = process.env.ENV;
const env = {};

const allEnvs = [
  'development',
  'test',
  'staging',
  'production'
];

const otherEnvs = allEnvs.filter(item => item !== ENV);

const BLACKLIST = [
  '_',
  'HOME',
  'PATH',
  'PWD',
  'PORT',
  'GCLOUD_SERVICE_ACCOUNT_KEY',
  'HOSTNAME'
];

function skipKey(key) {
  for (let i = 0; i < otherEnvs.length; ++i) {
    if (key.startsWith(`${otherEnvs[i]}_`)) {
      return true;
    }
  }

  return (
    BLACKLIST.indexOf(key) !== -1 ||
    key.startsWith('npm_') ||
    key.startsWith('__') ||
    key.startsWith('NODE_')
  )
}

Object.keys(process.env).forEach(key => {
  let parsedKey = key;
  if (!skipKey(key)) {
    if (parsedKey.startsWith(`${ENV}_`)) {
      parsedKey = parsedKey.substring(ENV.length + 1);
    }
    let value = process.env[key];
    env[parsedKey] = value;
  }
});

console.log(env);

fs.writeFileSync(FILE_PATH_JSON, JSON.stringify(env));
