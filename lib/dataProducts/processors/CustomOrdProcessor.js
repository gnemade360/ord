const BaseProcessor = require("./BaseProcessor");
const { SOURCE_TYPES } = require("../constants");
const { loadCustomConfiguration } = require("../config");
const { mergeConfiguration } = require("../utils");
const { Logger } = require("../../logger");

class CustomOrdProcessor extends BaseProcessor {
    async process(dataProducts, context) {
        const { customConfigPath } = context;
        Logger.info("CustomOrdProcessor: Loading and merging custom configuration");
        
        const customConfig = loadCustomConfiguration(customConfigPath);
        
        if (!customConfig || !customConfig.dataProducts || customConfig.dataProducts.length === 0) {
            Logger.info("CustomOrdProcessor: No custom configuration found or no data products defined");
            return dataProducts;
        }
        
        const result = mergeConfiguration(dataProducts, customConfig);
        
        Logger.info(`CustomOrdProcessor: Merged ${result.mergedCount} data products from custom configuration`);
        if (result.conflicts.length > 0) {
            Logger.info(`CustomOrdProcessor: Resolved ${result.conflicts.length} configuration conflicts`);
            result.conflicts.forEach(conflict => {
                Logger.debug(`Data product ${conflict.dataProductId}: overridden fields - ${conflict.fields.map(f => f.field).join(", ")}`);
            });
        }
        
        if (customConfig.dataProducts) {
            customConfig.dataProducts.forEach(customDP => {
                const exists = dataProducts.some(dp => dp.id === customDP.id);
                if (!exists) {
                    Logger.info(`CustomOrdProcessor: Ignoring custom data product ${customDP.id} - no matching service found`);
                }
            });
        }
        
        return result.dataProducts.map(dp => {
            if (dp.source === "custom") {
                return { ...dp, source: SOURCE_TYPES.CUSTOM };
            }
            return dp;
        });
    }
}

module.exports = CustomOrdProcessor;