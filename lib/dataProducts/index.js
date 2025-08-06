const { createDataProductProcessor } = require("./processors/processor");
const { buildDataProducts } = require("./builder");
const { Logger } = require("../logger");
const cds = require("@sap/cds");

async function processDataProducts(csn, appConfig) {
    
    try {
        // Check if feature is enabled
        if (!isDataProductsEnabled()) {
            Logger.info("Data products feature is disabled");
            return [];
        }
        
        Logger.info("Processing data products");
        
        // Create processor chain and context
        const processor = createDataProductProcessor();
        const context = {
            csn,
            namespace: appConfig.ordNamespace,
            customConfigPath: cds.env.ord?.customOrdContentFile
        };
        
        // Run the processing chain
        const processedDataProducts = await processor.process(context);
        
        // Build data products with complete structure for ORD
        // Use the first package (in simple cases there's only one)
        const packageInfo = appConfig.packages?.[0];
        const dataProducts = buildDataProducts(processedDataProducts, csn, packageInfo);
        
        Logger.info(`Generated ${dataProducts.length} data products`);
        return dataProducts;
        
    } catch (error) {
        Logger.error("Failed to process data products", {
            error: error.message,
            stack: error.stack,
            context: {
                namespace: context?.namespace,
                customConfigPath: context?.customConfigPath
            }
        });
        // Return empty array on error to not break ORD generation
        // This ensures partial ORD generation can continue even if data products fail
        return [];
    }
}

function isDataProductsEnabled() {
    // Check environment variable first
    if (process.env.ORD_ENABLE_DATA_PRODUCTS === "true") {
        return true;
    }
    
    // Check cds configuration
    if (cds.env.ord?.features?.dataProducts === true) {
        return true;
    }
    
    // Default is disabled
    return false;
}

module.exports = {
    processDataProducts,
    isDataProductsEnabled
};