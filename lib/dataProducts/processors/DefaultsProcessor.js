const BaseProcessor = require("./BaseProcessor");
const { DEFAULTS, SOURCE_TYPES } = require("../constants");
const { generateDataProductId } = require("../utils");
const { Logger } = require("../../logger");
const { DESCRIPTION_PREFIX } = require("../../constants");

class DefaultsProcessor extends BaseProcessor {
    async process(dataProducts, context) {
        const { csn, namespace } = context;
        Logger.info("DefaultsProcessor: Creating default data products for all services");
        
        const defaultDataProducts = [];
        
        Object.entries(csn.definitions).forEach(([name, definition]) => {
            if (definition.kind === "service") {
                const dataProduct = this.initDataProductObj(name, namespace);
                defaultDataProducts.push(dataProduct);
            }
        });
        
        Logger.info(`DefaultsProcessor: Created ${defaultDataProducts.length} default data products`);
        return defaultDataProducts;
    }
    
    initDataProductObj(serviceName, namespace) {
        return {
            id: generateDataProductId(namespace, serviceName),
            localId: serviceName,
            title: serviceName,
            description: DESCRIPTION_PREFIX + serviceName,
            shortDescription: DESCRIPTION_PREFIX + serviceName,
            version: DEFAULTS.VERSION,
            type: DEFAULTS.TYPE,
            category: DEFAULTS.CATEGORY || 'business-object',
            visibility: DEFAULTS.VISIBILITY,
            serviceName: serviceName,
            tags: [],
            source: SOURCE_TYPES.DEFAULT
        };
    }
}

module.exports = DefaultsProcessor;