const { Logger } = require("../../logger");

/**
 * Validate DPD against FOS naming conventions
 * @param {object} dpd - DPD object
 * @returns {boolean} - True if valid
 */
function validateDpd(dpd) {
    // Check naming conventions - allow dots for namespaced names
    const namePattern = /^[a-zA-Z0-9_.]+$/;
    
    if (!namePattern.test(dpd.name)) {
        Logger.error(`Invalid DPD name: ${dpd.name}. Only alphanumeric characters, underscores, and dots are allowed.`);
        return false;
    }
    
    // Check version format (semantic versioning)
    const versionPattern = /^\d+\.\d+\.\d+$/;
    if (!versionPattern.test(dpd.version)) {
        Logger.error(`Invalid version format: ${dpd.version}. Use semantic versioning (x.x.x).`);
        return false;
    }
    
    // Check required fields
    const requiredFields = ['name', 'version', 'title', 'type', 'category'];
    for (const field of requiredFields) {
        if (!dpd[field]) {
            Logger.error(`Missing required field: ${field}`);
            return false;
        }
    }
    
    // Validate type field
    const validTypes = ['primary', 'derived'];
    if (!validTypes.includes(dpd.type)) {
        Logger.error(`Invalid type: ${dpd.type}. Must be 'primary' or 'derived'.`);
        return false;
    }
    
    // Validate category field
    const validCategories = ['business-object', 'master-data', 'analytical', 'event'];
    if (!validCategories.includes(dpd.category)) {
        Logger.error(`Invalid category: ${dpd.category}. Must be one of: ${validCategories.join(', ')}`);
        return false;
    }
    
    return true;
}

module.exports = {
    validateDpd
};