const cds = require('@sap/cds');

// Directly register the build provider
if (cds.cli?.command === "build") {
    if (!cds.build) cds.build = {};
    if (!cds.build.register) cds.build.register = function(name, handler) {
        if (!cds.build.tasks) cds.build.tasks = {};
        cds.build.tasks[name] = handler;
    };
    cds.build.register("ord", require('@cap-js/ord/lib/build'));
}

// Load the parent plugin (but avoid circular dependency)
require('@cap-js/ord/lib/index');