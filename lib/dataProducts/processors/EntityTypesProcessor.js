const BaseProcessor = require('./BaseProcessor');
const { Logger } = require('../../logger');

class EntityTypesProcessor extends BaseProcessor {
    process(dataProducts, context) {
        Logger.info(`Applying entity types to ${dataProducts.length} data products`);
        
        return dataProducts.map(dp => {
            try {
                return this.enrichWithEntityTypes(dp, context);
            } catch (error) {
                this.handleError(error, `entity types enrichment for ${dp.id}`);
                return dp;
            }
        });
    }
    
    enrichWithEntityTypes(dp, context) {
        const { csn, namespace } = context;
        const service = csn.definitions[dp.serviceName];
        
        if (!service) return dp;
        
        const enriched = { ...dp };
        const entityTypes = new Set();
        
        if (service['@ORD.entityTypes']) {
            const annotatedTypes = Array.isArray(service['@ORD.entityTypes']) 
                ? service['@ORD.entityTypes'] 
                : [service['@ORD.entityTypes']];
            annotatedTypes.forEach(type => entityTypes.add(type));
        }
        
        Object.entries(service.elements || {}).forEach(([elemName, elem]) => {
            if (elem.kind === 'entity') {
                const entity = csn.definitions[elem.target];
                if (entity && entity['@ORD.entityType']) {
                    entityTypes.add(entity['@ORD.entityType']);
                } else {
                    const entityTypeName = elem.target ? elem.target.split('.').pop() : elemName;
                    const entityTypeId = `${namespace}:entityType:${entityTypeName}:v1`;
                    entityTypes.add(entityTypeId);
                }
            }
        });
        
        Object.values(service.elements || {}).forEach(elem => {
            if (elem.target) {
                const targetDef = csn.definitions[elem.target];
                if (targetDef && targetDef.kind === 'entity' && targetDef['@ORD.entityType']) {
                    entityTypes.add(targetDef['@ORD.entityType']);
                }
            }
        });
        
        if (entityTypes.size > 0) {
            enriched.entityTypes = Array.from(entityTypes);
        }
        
        return enriched;
    }
}

module.exports = EntityTypesProcessor;