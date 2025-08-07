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
    
    const dataProducts = createDefaultDataProducts(csn, namespace);
    
    dataProducts.forEach(dataProduct => {
        try {
            const service = csn.definitions[dataProduct.serviceName];
            
            if (service[ANNOTATIONS.DATA_PRODUCT]) {
                applyServiceAnnotations(dataProduct, service[ANNOTATIONS.DATA_PRODUCT]);
            }
            
            enrichWithEntityAnnotations(dataProduct, service, csn);
        } catch (error) {
            Logger.warn(`Failed to process annotations for ${dataProduct.serviceName}: ${error.message}`);
        }
    });
    
    return dataProducts;
}

function createDefaultDataProducts(csn, namespace) {
    const dataProducts = [];
    
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
    if (annotation.title) dataProduct.title = annotation.title;
    if (annotation.description) dataProduct.description = annotation.description;
    if (annotation.version) {
        dataProduct.version = annotation.version;
        const versionSuffix = `v${annotation.version.split('.')[0]}`;
        dataProduct.id = dataProduct.id.replace(/v\d+$/, versionSuffix);
    }
    if (annotation.type) dataProduct.type = validateType(annotation.type);
    if (annotation.visibility) dataProduct.visibility = validateVisibility(annotation.visibility);
    if (annotation.responsible) dataProduct.responsible = annotation.responsible;
    if (annotation.tags) {
        dataProduct.tags = [...dataProduct.tags, ...processTags(annotation.tags)];
    }
    
    dataProduct.source = SOURCE_TYPES.ANNOTATED;
}

function enrichWithEntityAnnotations(dataProduct, service, csn) {
    const entities = extractServiceEntities(service, csn);
    
    const schemaEntity = entities.find(e => e[ANNOTATIONS.SCHEMA]);
    if (schemaEntity) {
        dataProduct.schema = schemaEntity[ANNOTATIONS.SCHEMA];
    }
    
    const lineageEntity = entities.find(e => e[ANNOTATIONS.LINEAGE]);
    if (lineageEntity) {
        dataProduct.lineage = lineageEntity[ANNOTATIONS.LINEAGE];
    }
    
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