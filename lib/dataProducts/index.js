const { createDataProductProcessor } = require("./processors/processor");
const { buildDataProducts } = require("./builder");
const { Logger } = require("../logger");
const cds = require("@sap/cds");

function processDataProducts(csn, appConfig) {
    
    try {
        if (!isDataProductsEnabled()) {
            Logger.info("Data products feature is disabled");
            return [];
        }
        
        Logger.info("Processing data products");
        
        const processor = createDataProductProcessor();
        const context = {
            csn,
            namespace: appConfig.ordNamespace,
            customConfigPath: cds.env.ord?.customOrdContentFile
        };
        
        const processedDataProducts = processor.process(context);
        
        const packageInfo = appConfig.packages?.[0];
        const dataProducts = buildDataProducts(processedDataProducts, csn, packageInfo);
        
        Logger.info(`Generated ${dataProducts.length} data products`);
        return dataProducts;
        
    } catch (error) {
        Logger.error("Failed to process data products", {
            error: error.message,
            stack: error.stack,
            context: {
                namespace: appConfig?.ordNamespace,
                customConfigPath: cds.env.ord?.customOrdContentFile
            }
        });
        return [];
    }
}

function isDataProductsEnabled() {
    // Check CDS configuration first (from .cdsrc.json or package.json)
    if (cds.env.ord?.dataProducts?.enabled === true) {
        return true;
    }
    
    // Backward compatibility for old configuration
    if (cds.env.ord?.features?.dataProducts === true) {
        Logger.info("Using deprecated cds.ord.features.dataProducts. Please use cds.ord.dataProducts.enabled instead.");
        return true;
    }
    
    // Fallback to environment variable for backward compatibility
    if (process.env.ORD_ENABLE_DATA_PRODUCTS === "true") {
        Logger.info("Using deprecated ORD_ENABLE_DATA_PRODUCTS env variable. Please use cds.ord.dataProducts.enabled in .cdsrc.json instead.");
        return true;
    }
    
    return false;
}

module.exports = {
    processDataProducts,
    isDataProductsEnabled
};