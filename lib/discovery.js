var packageJSON = require('../package.json')
  , appVersion = 'v' + packageJSON.version.split('.').slice(0, -1).join('-')
  ;
// Finds managers using dis.covery.
exports.managers = require('dis.covery')('disio-manager', appVersion);