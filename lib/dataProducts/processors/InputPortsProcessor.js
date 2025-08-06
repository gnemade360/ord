const BaseProcessor = require('./BaseProcessor');
const { Logger } = require('../../logger');

class InputPortsProcessor extends BaseProcessor {
    process(dataProducts, context) {
        Logger.info(`Processing input ports for ${dataProducts.length} data products`);
        
        return dataProducts.map(dp => {
            try {
                return this.enrichWithInputPorts(dp, context);
            } catch (error) {
                this.handleError(error, `input ports processing for ${dp.id}`);
                return dp;
            }
        });
    }
    
    enrichWithInputPorts(dp, context) {
        const { csn, namespace } = context;
        const service = csn.definitions[dp.serviceName];
        
        if (!service) return dp;
        
        const enriched = { ...dp };
        
        // Check for @ORD.inputPorts annotation
        if (service['@ORD.inputPorts']) {
            const inputPorts = Array.isArray(service['@ORD.inputPorts']) 
                ? service['@ORD.inputPorts'] 
                : [service['@ORD.inputPorts']];
            
            enriched.inputPorts = inputPorts.map(port => {
                if (typeof port === 'string') {
                    // Simple string format - assume it's an integration dependency ID
                    return { ordId: this.normalizeIntegrationDependencyId(port, namespace) };
                } else if (typeof port === 'object' && port.ordId) {
                    // Object format with ordId
                    return {
                        ordId: this.normalizeIntegrationDependencyId(port.ordId, namespace),
                        description: port.description
                    };
                }
                return null;
            }).filter(Boolean);
        }
        
        // Check for @ORD.integrationDependency annotation (alternative way)
        if (service['@ORD.integrationDependency'] && !enriched.inputPorts) {
            const deps = Array.isArray(service['@ORD.integrationDependency'])
                ? service['@ORD.integrationDependency']
                : [service['@ORD.integrationDependency']];
            
            enriched.inputPorts = deps.map(dep => ({
                ordId: this.normalizeIntegrationDependencyId(dep, namespace)
            }));
        }
        
        // Auto-detect if service uses external dependencies (derived data product pattern)
        if (!enriched.inputPorts && dp.type === 'derived') {
            // Look for annotations that indicate external data sources
            const externalDeps = this.detectExternalDependencies(service, csn);
            if (externalDeps.length > 0) {
                enriched.inputPorts = externalDeps.map(dep => ({
                    ordId: this.generateIntegrationDependencyId(dep, namespace)
                }));
            }
        }
        
        return enriched;
    }
    
    normalizeIntegrationDependencyId(id, namespace) {
        // If already a full ORD ID, return as is
        if (id.includes(':integrationDependency:')) {
            return id;
        }
        
        // If it looks like a simple name, generate full ID
        if (!id.includes(':')) {
            return `${namespace}:integrationDependency:${id}:v1`;
        }
        
        return id;
    }
    
    generateIntegrationDependencyId(dependency, namespace) {
        const name = dependency.name || dependency.service || 'ExternalData';
        return `${namespace}:integrationDependency:${name}:v1`;
    }
    
    detectExternalDependencies(service, csn) {
        const dependencies = [];
        
        // Check for @ORD.externalSource annotations on entities
        Object.values(service.elements || {}).forEach(elem => {
            if (elem.target) {
                const targetDef = csn.definitions[elem.target];
                if (targetDef && targetDef['@ORD.externalSource']) {
                    dependencies.push({
                        name: targetDef['@ORD.externalSource'],
                        entity: elem.target
                    });
                }
            }
        });
        
        // Check for remote service consumption patterns
        if (service['@ORD.consumes']) {
            const consumed = Array.isArray(service['@ORD.consumes'])
                ? service['@ORD.consumes']
                : [service['@ORD.consumes']];
            consumed.forEach(svc => {
                dependencies.push({ service: svc });
            });
        }
        
        return dependencies;
    }
}

module.exports = InputPortsProcessor;