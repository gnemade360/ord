// Debug and load the ORD plugin from the parent directory
const cds = require('@sap/cds');
console.log('[DEBUG] Loading ORD plugin, cds.cli.command:', cds.cli?.command);

// Directly register the build provider
if (!cds.build) cds.build = {};
if (!cds.build.register) cds.build.register = {};
cds.build.register.ord = require('@cap-js/ord/lib/build');

// Also load the original plugin
require('@cap-js/ord/cds-plugin');