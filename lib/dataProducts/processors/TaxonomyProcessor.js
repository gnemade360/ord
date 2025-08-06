const BaseProcessor = require('./BaseProcessor');
const { Logger } = require('../../logger');

class TaxonomyProcessor extends BaseProcessor {
    process(dataProducts, context) {
        Logger.info(`Applying taxonomy fields to ${dataProducts.length} data products`);
        
        return dataProducts.map(dp => {
            try {
                return this.enrichWithTaxonomyFields(dp, context);
            } catch (error) {
                this.handleError(error, `taxonomy enrichment for ${dp.id}`);
                return dp;
            }
        });
    }
    
    enrichWithTaxonomyFields(dp, context) {
        const { csn } = context;
        const service = csn.definitions[dp.serviceName];
        
        if (!service) return dp;
        
        const enriched = { ...dp };
        
        // Check for taxonomy annotations on the service
        if (service['@ORD.taxonomy']) {
            const taxonomy = service['@ORD.taxonomy'];
            
            // Industry classification
            if (taxonomy.industry) {
                enriched.industry = this.normalizeArray(taxonomy.industry);
            }
            
            // Line of Business
            if (taxonomy.lineOfBusiness) {
                enriched.lineOfBusiness = this.normalizeArray(taxonomy.lineOfBusiness);
            }
            
            // Countries
            if (taxonomy.countries) {
                enriched.countries = this.normalizeArray(taxonomy.countries)
                    .map(c => c.toUpperCase())
                    .filter(c => /^[A-Z]{2}$/.test(c)); // ISO 3166-1 alpha-2
            }
        }
        
        // Check for individual annotations
        if (service['@ORD.industry'] && !enriched.industry) {
            enriched.industry = this.normalizeArray(service['@ORD.industry']);
        }
        
        if (service['@ORD.lineOfBusiness'] && !enriched.lineOfBusiness) {
            enriched.lineOfBusiness = this.normalizeArray(service['@ORD.lineOfBusiness']);
        }
        
        if (service['@ORD.countries'] && !enriched.countries) {
            enriched.countries = this.normalizeArray(service['@ORD.countries'])
                .map(c => c.toUpperCase())
                .filter(c => /^[A-Z]{2}$/.test(c));
        }
        
        // Process labels and documentation labels
        if (service['@ORD.labels']) {
            enriched.labels = this.processLabels(service['@ORD.labels']);
        }
        
        if (service['@ORD.documentationLabels']) {
            enriched.documentationLabels = this.processLabels(service['@ORD.documentationLabels']);
        }
        
        // Process correlation IDs
        if (service['@ORD.correlationIds']) {
            enriched.correlationIds = this.normalizeArray(service['@ORD.correlationIds']);
        }
        
        return enriched;
    }
    
    normalizeArray(value) {
        if (Array.isArray(value)) {
            return value;
        }
        if (typeof value === 'string') {
            return value.split(',').map(v => v.trim()).filter(v => v);
        }
        return [];
    }
    
    processLabels(labels) {
        if (!labels || typeof labels !== 'object') return undefined;
        
        const processed = {};
        Object.entries(labels).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                processed[key] = value.filter(v => typeof v === 'string');
            } else if (typeof value === 'string') {
                processed[key] = [value];
            }
        });
        
        return Object.keys(processed).length > 0 ? processed : undefined;
    }
}

module.exports = TaxonomyProcessor;