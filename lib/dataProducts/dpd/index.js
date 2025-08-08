/**
 * Main entry point for DPD (Data Product Descriptor) generation
 * This module generates separate DPD files following FOS V2 schema
 */

const { generateDpdFiles, isDpdGenerationEnabled } = require("./generator");
const { buildDpd } = require("./builder");
const { validateDpd } = require("./validator");
const { 
    DPD_BUILD_DEFAULT_PATH,
    FOS_SCHEMA_URL,
    DPD_VALID_TYPES,
    DPD_VALID_CATEGORIES,
    DPD_VALID_VISIBILITY,
    DPD_DEFAULT_STATUS
} = require("./constants");

module.exports = {
    // Main functions
    generateDpdFiles,
    isDpdGenerationEnabled,
    
    // Individual components for flexibility
    buildDpd,
    validateDpd,
    
    // Constants
    DPD_BUILD_DEFAULT_PATH,
    FOS_SCHEMA_URL,
    DPD_VALID_TYPES,
    DPD_VALID_CATEGORIES,
    DPD_VALID_VISIBILITY,
    DPD_DEFAULT_STATUS
};