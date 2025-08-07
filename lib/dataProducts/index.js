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
    if (process.env.ORD_ENABLE_DATA_PRODUCTS === "true") {
        return true;
    }
    
    if (cds.env.ord?.features?.dataProducts === true) {
        return true;
    }
    
    return false;
}

module.exports = {
    processDataProducts,
    isDataProductsEnabled
};