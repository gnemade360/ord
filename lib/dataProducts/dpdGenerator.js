const { Logger } = require("../logger");
const { buildDpd } = require("./dpdBuilder");
const cds = require("@sap/cds");

/**
 * Extract data product annotations from a service definition
 * @param {string} serviceName - Name of the service
 * @param {object} serviceDefinition - Service definition from CSN
 * @returns {object|null} - Extracted data product configuration
 */
function extractDataProductAnnotations(serviceName, serviceDefinition) {
    Logger.info(`Checking service ${serviceName} for data product annotations...`);
    
    // Check if there are any @ORD.dataProduct annotations (flattened format)
    const hasDataProductAnnotations = Object.keys(serviceDefinition).some(key => 
        key.startsWith("@ORD.dataProduct") || key.startsWith("@ord.dataProduct")
    );
    
    if (!hasDataProductAnnotations) {
        return null;
    }
    
    Logger.info(`Found data product annotations for ${serviceName}`);
    
    // Extract flattened annotations
    const config = {
        name: serviceName,
        version: "1.0.0" // Default version
    };
    
    // Helper function to get annotation value
    const getAnnotation = (prefix) => {
        return serviceDefinition[`@ORD.${prefix}`] || 
               serviceDefinition[`@ord.${prefix}`];
    };
    
    // Extract data product properties
    config.title = getAnnotation("dataProduct.title") || serviceName;
    config.type = getAnnotation("dataProduct.type") || "primary";
    config.visibility = getAnnotation("dataProduct.visibility") || "internal";
    config.category = getAnnotation("dataProduct.category") || "business-object";
    config.description = getAnnotation("dataProduct.description") || `Data product for ${serviceName}`;
    
    const version = getAnnotation("dataProduct.version");
    if (version) config.version = version;
    
    // Extract lifecycle information
    const lifecycleStatus = getAnnotation("lifecycle.status");
    if (lifecycleStatus) {
        config.lifecycle = {
            status: lifecycleStatus,
            deprecationDate: getAnnotation("lifecycle.deprecationDate"),
            sunsetDate: getAnnotation("lifecycle.sunsetDate"),
            lastUpdate: getAnnotation("lifecycle.lastUpdate")
        };
    }
    
    // Extract governance information
    const policyLevel = getAnnotation("governance.policyLevel");
    if (policyLevel) {
        config.governance = {
            policyLevel: policyLevel,
            dataClassification: getAnnotation("governance.dataClassification")
        };
    }
    
    // Extract arrays and complex types
    config.compliance = getAnnotation("compliance");
    config.industry = getAnnotation("industry");
    config.lineOfBusiness = getAnnotation("lineOfBusiness");
    config.countries = getAnnotation("countries");
    config.labels = getAnnotation("labels");
    config.inputPorts = getAnnotation("inputPorts");
    config.dataProductLinks = getAnnotation("dataProductLinks");
    config.tags = getAnnotation("tags");
    config.correlationIds = getAnnotation("correlationIds");
    config.personalData = getAnnotation("personalData");
    config.dataRetention = getAnnotation("dataRetention");
    config.dataClassification = getAnnotation("dataClassification");
    config.systemInstanceAware = getAnnotation("systemInstanceAware");
    config.documentationLabels = getAnnotation("documentationLabels");
    config.links = getAnnotation("links");
    config.taxonomy = getAnnotation("taxonomy");
    
    // Clean up undefined values
    Object.keys(config).forEach(key => {
        if (config[key] === undefined) {
            delete config[key];
        }
    });
    
    return config;
}

/**
 * Generate DPD files from CSN
 * @param {object} csn - Compiled Service Network
 * @param {object} appConfig - Application configuration
 * @returns {Array} - Array of DPD objects with filename and content
 */
function generateDpdFiles(csn, appConfig) {
    const dpdFiles = [];
    
    // Process all service definitions
    Object.entries(csn.definitions).forEach(([name, definition]) => {
        if (definition.kind === "service") {
            const dpConfig = extractDataProductAnnotations(name, definition);
            
            if (dpConfig) {
                Logger.info(`Generating DPD for service: ${name}`);
                
                try {
                    // Build DPD according to FOS schema
                    const dpd = buildDpd(dpConfig, csn, appConfig);
                    
                    // Generate filename according to FOS naming convention
                    const filename = `${dpConfig.name}_${dpConfig.version}.json`;
                    
                    dpdFiles.push({
                        filename,
                        content: dpd,
                        serviceName: name
                    });
                    
                    Logger.info(`Generated DPD: ${filename}`);
                } catch (error) {
                    Logger.error(`Failed to generate DPD for ${name}: ${error.message}`);
                }
            }
        }
    });
    
    Logger.info(`Generated ${dpdFiles.length} DPD files`);
    return dpdFiles;
}

/**
 * Check if DPD generation is enabled
 * @returns {boolean}
 */
function isDpdGenerationEnabled() {
    return process.env.DPD_GENERATION_ENABLED === "true" || 
           cds.env.dpd?.enabled === true;
}

module.exports = {
    generateDpdFiles,
    extractDataProductAnnotations,
    isDpdGenerationEnabled
};