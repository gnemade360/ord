const BaseProcessor = require("./BaseProcessor");
const { ANNOTATIONS, SOURCE_TYPES } = require("../constants");
const { 
    validateType, 
    validateVisibility, 
    processTags,
    mergeUniqueTags 
} = require("../utils");
const { Logger } = require("../../logger");

class AnnotationsProcessor extends BaseProcessor {
    async process(dataProducts, context) {
        const { csn } = context;
        Logger.info("AnnotationsProcessor: Applying CDS annotations to data products");
        
        const annotatedDataProducts = dataProducts.map(dataProduct => {
            try {
                const service = csn.definitions[dataProduct.serviceName];
                if (!service) {
                    return dataProduct;
                }
                
                let annotated = { ...dataProduct };
                
                // Apply service-level annotations
                if (service[ANNOTATIONS.DATA_PRODUCT]) {
                    annotated = this.applyServiceAnnotations(annotated, service[ANNOTATIONS.DATA_PRODUCT]);
                }
                
                // Apply entity-level annotations
                annotated = this.enrichWithEntityAnnotations(annotated, service, csn);
                
                return annotated;
            } catch (error) {
                Logger.warn(`Failed to process annotations for ${dataProduct.serviceName}: ${error.message}`);
                return dataProduct;
            }
        });
        
        const annotatedCount = annotatedDataProducts.filter(dp => dp.source === SOURCE_TYPES.ANNOTATED).length;
        Logger.info(`AnnotationsProcessor: Applied annotations to ${annotatedCount} data products`);
        
        return annotatedDataProducts;
    }
    
    applyServiceAnnotations(dataProduct, annotation) {
        const updated = { ...dataProduct };
        
        if (annotation.title) updated.title = annotation.title;
        if (annotation.description) updated.description = annotation.description;
        if (annotation.version) {
            updated.version = annotation.version;
            // Update ID if version changed
            const versionSuffix = `v${annotation.version.split('.')[0]}`;
            updated.id = updated.id.replace(/v\d+$/, versionSuffix);
        }
        if (annotation.type) updated.type = validateType(annotation.type);
        if (annotation.visibility) updated.visibility = validateVisibility(annotation.visibility);
        if (annotation.responsible) updated.responsible = annotation.responsible;
        if (annotation.tags) {
            updated.tags = [...updated.tags, ...processTags(annotation.tags)];
        }
        
        // Mark that annotations were applied
        updated.source = SOURCE_TYPES.ANNOTATED;
        
        return updated;
    }
    
    enrichWithEntityAnnotations(dataProduct, service, csn) {
        const entities = this.extractServiceEntities(service, csn);
        const updated = { ...dataProduct };
        
        // Extract schema from first entity that has it
        const schemaEntity = entities.find(e => e[ANNOTATIONS.SCHEMA]);
        if (schemaEntity) {
            updated.schema = schemaEntity[ANNOTATIONS.SCHEMA];
            updated.source = SOURCE_TYPES.ANNOTATED;
        }
        
        // Extract lineage from first entity that has it
        const lineageEntity = entities.find(e => e[ANNOTATIONS.LINEAGE]);
        if (lineageEntity) {
            updated.lineage = lineageEntity[ANNOTATIONS.LINEAGE];
            updated.source = SOURCE_TYPES.ANNOTATED;
        }
        
        // Collect all property tags
        const propertyTags = this.extractPropertyTags(entities);
        if (propertyTags.length > 0) {
            updated.tags = mergeUniqueTags(updated.tags, propertyTags);
            updated.source = SOURCE_TYPES.ANNOTATED;
        }
        
        return updated;
    }
    
    extractServiceEntities(service, csn) {
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
    
    extractPropertyTags(entities) {
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
}

module.exports = AnnotationsProcessor;