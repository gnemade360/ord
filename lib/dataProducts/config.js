const fs = require("fs");
const path = require("path");
const cds = require("@sap/cds");
const { Logger } = require("../logger");
const { RESOURCE_VISIBILITY } = require("../constants");
const { VALID_TYPES } = require("./constants");
const { mergeConfiguration } = require("./utils");

function loadCustomConfiguration(customConfigPath) {
    
    if (!customConfigPath) {
        // Default path using path.resolve for cross-platform compatibility
        customConfigPath = path.resolve(cds.root, "ord", "custom.ord.json");
    } else {
        // Ensure provided path is resolved correctly
        customConfigPath = path.resolve(customConfigPath);
    }
    
    try {
        if (fs.existsSync(customConfigPath)) {
            const content = fs.readFileSync(customConfigPath, "utf8");
            const config = JSON.parse(content);
            Logger.info(`Loaded custom ORD configuration from ${customConfigPath}`);
            return config;
        }
    } catch (error) {
        Logger.error(`Failed to load custom configuration from ${customConfigPath}: ${error.message}`);
    }
    
    return null;
}


function validateConfiguration(config) {
    const errors = [];
    
    if (!config.id) {
        errors.push("Data product ID is required");
    }
    
    if (!config.title) {
        errors.push("Data product title is required");
    }
    
    if (!config.version || !/^\d+\.\d+\.\d+$/.test(config.version)) {
        errors.push("Valid semantic version is required (e.g., 1.0.0)");
    }
    
    if (!VALID_TYPES.includes(config.type)) {
        errors.push(`Type must be one of: ${VALID_TYPES.join(", ")}`);
    }
    
    const validVisibilities = Object.values(RESOURCE_VISIBILITY);
    if (config.visibility && !validVisibilities.includes(config.visibility)) {
        errors.push(`Visibility must be one of: ${validVisibilities.join(", ")}`);
    }
    
    return errors;
}

module.exports = {
    loadCustomConfiguration,
    validateConfiguration
};