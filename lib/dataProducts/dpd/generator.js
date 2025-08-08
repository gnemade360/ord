const { Logger } = require("../../logger");
const { buildDpd } = require("./builder");
const { validateDpd } = require("./validator");
const { createDataProductProcessor } = require("../processors/processor");
const cds = require("@sap/cds");

/**
 * Generate DPD files from CSN using the processor chain
 * @param {object} csn - Compiled Service Network
 * @param {object} appConfig - Application configuration
 * @returns {Array} - Array of DPD objects with filename and content
 */
function generateDpdFiles(csn, appConfig) {
    const dpdFiles = [];
    
    try {
        Logger.info("Starting DPD file generation using processor chain...");
        
        // Create and run the processor chain - same as ORD uses
        const processor = createDataProductProcessor();
        const context = {
            csn,
            namespace: appConfig.ordNamespace,
            customConfigPath: cds.env.ord?.customOrdContentFile
        };
        
        // Get processed data products using the same chain as ORD
        const processedDataProducts = processor.process(context);
        
        if (!processedDataProducts || processedDataProducts.length === 0) {
            Logger.info("No data products found by processor chain");
            return dpdFiles;
        }
        
        Logger.info(`Processor chain found ${processedDataProducts.length} data products`);
        
        // Convert each processed data product to DPD format
        for (const dataProduct of processedDataProducts) {
            try {
                Logger.info(`Generating DPD for data product: ${dataProduct.name}`);
                
                // Build DPD according to FOS V2 schema
                const dpd = buildDpd(dataProduct, csn, appConfig);
                
                // Validate the DPD
                if (!validateDpd(dpd)) {
                    Logger.error(`Skipping invalid DPD: ${dataProduct.name}`);
                    continue;
                }
                
                // Generate filename according to FOS naming convention
                const filename = `${dpd.name}_${dpd.version}.json`;
                
                dpdFiles.push({
                    filename,
                    content: dpd,
                    serviceName: dataProduct.name
                });
                
                Logger.info(`Generated DPD: ${filename}`);
            } catch (error) {
                Logger.error(`Failed to generate DPD for ${dataProduct.name}: ${error.message}`);
            }
        }
        
    } catch (error) {
        Logger.error(`DPD generation failed: ${error.message}`);
        throw error;
    }
    
    Logger.info(`Generated ${dpdFiles.length} DPD files`);
    return dpdFiles;
}

/**
 * Check if DPD generation is enabled
 * @returns {boolean}
 */
function isDpdGenerationEnabled() {
    // Check CDS configuration first (from .cdsrc.json or package.json)
    if (cds.env.dpd?.dataProducts?.enabled === true) {
        return true;
    }
    
    // Backward compatibility for old configuration
    if (cds.env.dpd?.enabled === true) {
        Logger.warn("Using deprecated cds.dpd.enabled. Please use cds.dpd.dataProducts.enabled instead.");
        return true;
    }
    
    // Fallback to environment variable for backward compatibility
    if (process.env.DPD_GENERATION_ENABLED === "true") {
        Logger.warn("Using deprecated DPD_GENERATION_ENABLED env variable. Please use cds.dpd.dataProducts.enabled in .cdsrc.json instead.");
        return true;
    }
    
    return false;
}

module.exports = {
    generateDpdFiles,
    isDpdGenerationEnabled
};