var execSync = require('child_process').execSync;
var package = require('../package.json');

/*
Create release v[x.x.x] on Github, then update bitbout on NPM:
cd /Users/okaybenji/Code/bitbout; npm publish
*/

var paths = {
  bitboutNative: '/Users/okaybenji/Code/bitbout-native',
  bitbout: '/Users/okaybenji/Code/bitbout',
  bitboutReleases: '/Users/okaybenji/Code/bitbout-releases'
};

paths.macRelease = paths.bitboutReleases + '/Mac/bitbout-mac-v' + package.version;
paths.itchRelease = paths.bitboutReleases + '/itch.io/bitbout-itch-v' + package.version;
paths.windowsRelease = paths.bitboutReleases + '/Windows/bitbout-win-v' + package.version;
paths.linuxRelease = paths.bitboutReleases + '/Linux/bitbout-linux-v' + package.version;

var commands = [
  // delete old bitbout module from bitbout-native
  'rm -rf ' + paths.bitboutNative + '/node_modules/bitbout',
  // update bitbout in bitbout-native
  'cd ' + paths.bitboutNative + '; npm update; npm install',
  // build bitbout
  'cd ' + paths.bitboutNative + '/node_modules/bitbout; npm install; npm run build',
  // remove node modules (were only needed for build)
  'rm -rf ' + paths.bitboutNative + '/node_modules/bitbout/node_modules',

  // create itch.io version (copies from bitbout-native since it already has its node_modules removed)
  'cp -R ' + paths.bitboutNative + '/node_modules/bitbout ' + paths.itchRelease,
  // zip it
  'cd ' + paths.itchRelease + '; cd ..; zip -r ' + paths.itchRelease + '.zip bitbout-itch-v' + package.version,

  // copy libopenmpt (for editing)
  'mv ' + paths.bitboutNative + '/node_modules/bitbout/scripts/vendor/libopenmpt.js ' + paths.bitboutNative + '/node_modules/bitbout/scripts/vendor/libopenmpt.js.in',
  // edit libopenmpt: change path to libopenmpt.js.mem for Electron releases
  // '\\\' -> escape the following character, AND escape the escape character
  "sed -e 's/var memoryInitializer=\\\"\\\.\\\/scripts\\\/vendor\\\/libopenmpt\\\.js\\\.mem\\\";/var memoryInitializer=require\\\(\\\"path\\\"\\\)\\\.join\\\(__dirname, \\\"\\\/scripts\\\/vendor\\\/libopenmpt\\\.js\\\.mem\\\"\\\);/g' " + paths.bitboutNative + '/node_modules/bitbout/scripts/vendor/libopenmpt.js.in > ' + paths.bitboutNative + '/node_modules/bitbout/scripts/vendor/libopenmpt.js',
  // remove copy of libopenmpt
  'rm ' + paths.bitboutNative + '/node_modules/bitbout/scripts/vendor/libopenmpt.js.in',

  // create Mac version
  // add new folder for this Mac release
  'mkdir ' + paths.macRelease,
  // copy over the first Mac release
  'cp -R ' + paths.bitboutReleases + '/Mac/bitbout-mac-v1.0.0/bitbout.app ' + paths.macRelease + '/bitbout.app',
  // remove the old version of bitbout native from the copy
  'rm -rf ' + paths.macRelease + '/bitbout.app/Contents/Resources/app',
  // copy in the current (new) version of bitbout native
  'cp -R ' + paths.bitboutNative + ' ' + paths.macRelease + '/bitbout.app/Contents/Resources',
  // rename the copied folder to app, as expected by Electron
  'mv ' + paths.macRelease + '/bitbout.app/Contents/Resources/bitbout-native ' + paths.macRelease + '/bitbout.app/Contents/Resources/app',
  // replace readme.txt with latest version
  'cp ' + paths.bitboutReleases + '/readme.txt ' + paths.macRelease + '/readme.txt',
  // create zip file from the folder
  // NOTE: doing this manually; auto-zip removes the custom bitbout icon for some reason
  // 'cd ' + paths.macRelease + '; cd ..; zip -r ' + paths.macRelease + '.zip bitbout-mac-v' + package.version,

  // create Windows version from the new Mac release
  // copy over the first Windows release
  'cp -R ' + paths.bitboutReleases + '/Windows/bitbout-win-v1.0.0 ' + paths.windowsRelease,
  // copy over bitbout from the new Mac release
  'cp -R ' + paths.macRelease + '/bitbout.app/Contents/Resources/app ' + paths.windowsRelease + '/resources/',
  // zip the Windows version
  'cd ' + paths.windowsRelease + '; cd ..; zip -r ' + paths.windowsRelease + '.zip bitbout-win-v' + package.version,

  // create Linux version from the new Mac release
  // copy over the first Linux release
  'cp -R ' + paths.bitboutReleases + '/Linux/bitbout-linux-v1.0.0 ' + paths.linuxRelease,
  // copy over bitbout from the new Mac release
  'cp -R ' + paths.macRelease + '/bitbout.app/Contents/Resources/app ' + paths.linuxRelease + '/resources/',
  // zip the Linux version
  'cd ' + paths.linuxRelease + '; cd ..; zip -r ' + paths.linuxRelease + '.zip bitbout-linux-v' + package.version,

  // remove the folders (we only need to keep the zip archives)
  'rm -rf ' + paths.itchRelease,
  // 'rm -rf ' + paths.macRelease,
  'rm -rf ' + paths.windowsRelease,
  'rm -rf ' + paths.linuxRelease,
];

commands.forEach(function(cmd) {
  console.log('executing command:', cmd);
  execSync(cmd);
});

console.log('postpublish complete');
