const { Logger } = require("../logger");
const { 
    generateDataProductId, 
    validateType, 
    validateVisibility, 
    processTags,
    mergeUniqueTags 
} = require("./utils");
const { ANNOTATIONS, DEFAULTS, SOURCE_TYPES } = require("./constants");
const { DESCRIPTION_PREFIX } = require("../constants");

function extractDataProductsFromModel(csn, namespace) {
    
    // Step 1: Create default data products for all services
    const dataProducts = createDefaultDataProducts(csn, namespace);
    
    // Step 2: Apply annotations to enhance defaults
    dataProducts.forEach(dataProduct => {
        try {
            const service = csn.definitions[dataProduct.serviceName];
            
            // Apply service-level annotations if present
            if (service[ANNOTATIONS.DATA_PRODUCT]) {
                applyServiceAnnotations(dataProduct, service[ANNOTATIONS.DATA_PRODUCT]);
            }
            
            // Enrich with entity annotations
            enrichWithEntityAnnotations(dataProduct, service, csn);
        } catch (error) {
            Logger.warn(`Failed to process annotations for ${dataProduct.serviceName}: ${error.message}`);
        }
    });
    
    return dataProducts;
}

function createDefaultDataProducts(csn, namespace) {
    const dataProducts = [];
    
    // Create a default data product for every service
    Object.entries(csn.definitions).forEach(([name, definition]) => {
        if (definition.kind === "service") {
            dataProducts.push(initDataProductObj(name, namespace));
        }
    });
    
    return dataProducts;
}

function initDataProductObj(serviceName, namespace) {
    return {
        id: generateDataProductId(namespace, serviceName),
        title: serviceName,
        description: DESCRIPTION_PREFIX + serviceName,
        version: DEFAULTS.VERSION,
        type: DEFAULTS.TYPE,
        visibility: DEFAULTS.VISIBILITY,
        serviceName: serviceName,
        tags: [],
        source: SOURCE_TYPES.DEFAULT
    };
}

function applyServiceAnnotations(dataProduct, annotation) {
    // Apply annotation values to existing data product
    if (annotation.title) dataProduct.title = annotation.title;
    if (annotation.description) dataProduct.description = annotation.description;
    if (annotation.version) {
        dataProduct.version = annotation.version;
        // Update ID if version changed
        const versionSuffix = `v${annotation.version.split('.')[0]}`;
        dataProduct.id = dataProduct.id.replace(/v\d+$/, versionSuffix);
    }
    if (annotation.type) dataProduct.type = validateType(annotation.type);
    if (annotation.visibility) dataProduct.visibility = validateVisibility(annotation.visibility);
    if (annotation.responsible) dataProduct.responsible = annotation.responsible;
    if (annotation.tags) {
        dataProduct.tags = [...dataProduct.tags, ...processTags(annotation.tags)];
    }
    
    // Mark that annotations were applied
    dataProduct.source = SOURCE_TYPES.ANNOTATED;
}

function enrichWithEntityAnnotations(dataProduct, service, csn) {
    const entities = extractServiceEntities(service, csn);
    
    // Extract schema from first entity that has it
    const schemaEntity = entities.find(e => e[ANNOTATIONS.SCHEMA]);
    if (schemaEntity) {
        dataProduct.schema = schemaEntity[ANNOTATIONS.SCHEMA];
    }
    
    // Extract lineage from first entity that has it
    const lineageEntity = entities.find(e => e[ANNOTATIONS.LINEAGE]);
    if (lineageEntity) {
        dataProduct.lineage = lineageEntity[ANNOTATIONS.LINEAGE];
    }
    
    // Collect all property tags
    const propertyTags = extractPropertyTags(entities);
    if (propertyTags.length > 0) {
        dataProduct.tags = mergeUniqueTags(dataProduct.tags, propertyTags);
    }
}

function extractServiceEntities(service, csn) {
    const entities = [];
    
    Object.entries(service.elements || {}).forEach(([elemName, element]) => {
        if (element.kind === "entity" && element.target) {
            const entityDef = csn.definitions[element.target];
            if (entityDef) {
                entities.push(entityDef);
            }
        }
    });
    
    return entities;
}

function extractPropertyTags(entities) {
    const tags = [];
    
    entities.forEach(entity => {
        Object.values(entity.elements || {}).forEach(prop => {
            if (prop[ANNOTATIONS.TAG]) {
                tags.push(prop[ANNOTATIONS.TAG]);
            }
        });
    });
    
    return tags;
}

module.exports = {
    extractDataProductsFromModel
};