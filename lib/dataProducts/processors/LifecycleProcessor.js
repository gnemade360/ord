const BaseProcessor = require('./BaseProcessor');
const { Logger } = require('../../logger');
const { validateReleaseStatus, validateDate } = require('../utils');

class LifecycleProcessor extends BaseProcessor {
    process(dataProducts, context) {
        Logger.info(`Applying lifecycle fields to ${dataProducts.length} data products`);
        
        return dataProducts.map(dp => {
            try {
                return this.enrichWithLifecycleFields(dp, context);
            } catch (error) {
                this.handleError(error, `lifecycle enrichment for ${dp.id}`);
                return dp;
            }
        });
    }
    
    enrichWithLifecycleFields(dp, context) {
        const { csn } = context;
        const service = csn.definitions[dp.serviceName];
        
        if (!service) return dp;
        
        const enriched = { ...dp };
        
        // Check for lifecycle annotations on the service
        if (service['@ORD.lifecycle']) {
            const lifecycle = service['@ORD.lifecycle'];
            
            // Release status
            if (lifecycle.releaseStatus) {
                const validStatus = validateReleaseStatus(lifecycle.releaseStatus);
                if (validStatus) {
                    enriched.releaseStatus = validStatus;
                }
            }
            
            // Lifecycle status (for provisioning, deprovisioning, etc.)
            if (lifecycle.lifecycleStatus) {
                const validLifecycleStatuses = ['inactive', 'provisioning', 'active', 'deprovisioning', 'active-with-errors'];
                if (validLifecycleStatuses.includes(lifecycle.lifecycleStatus)) {
                    enriched.lifecycleStatus = lifecycle.lifecycleStatus;
                }
            }
            
            // Deprecation date
            if (lifecycle.deprecationDate) {
                const validDate = validateDate(lifecycle.deprecationDate);
                if (validDate) {
                    enriched.deprecationDate = validDate;
                }
            }
            
            // Sunset date
            if (lifecycle.sunsetDate) {
                const validDate = validateDate(lifecycle.sunsetDate);
                if (validDate) {
                    enriched.sunsetDate = validDate;
                }
            }
            
            // Successors
            if (lifecycle.successors && Array.isArray(lifecycle.successors)) {
                enriched.successors = lifecycle.successors.filter(s => typeof s === 'string');
            }
            
            // Changelog entries
            if (lifecycle.changelogEntries && Array.isArray(lifecycle.changelogEntries)) {
                enriched.changelogEntries = lifecycle.changelogEntries
                    .filter(entry => entry.date && entry.version)
                    .map(entry => ({
                        date: entry.date,
                        description: entry.description || '',
                        releaseStatus: validateReleaseStatus(entry.releaseStatus) || 'active',
                        version: entry.version,
                        url: entry.url
                    }));
            }
            
            // Last update date
            if (lifecycle.lastUpdate) {
                const validDate = validateDate(lifecycle.lastUpdate);
                if (validDate) {
                    enriched.lastUpdate = validDate;
                }
            }
        }
        
        // Check for @ORD.deprecated shorthand annotation
        if (service['@ORD.deprecated'] && !enriched.releaseStatus) {
            enriched.releaseStatus = 'deprecated';
            if (typeof service['@ORD.deprecated'] === 'string') {
                enriched.deprecationDate = validateDate(service['@ORD.deprecated']);
            }
        }
        
        // Check for @ORD.successor annotation
        if (service['@ORD.successor'] && !enriched.successors) {
            enriched.successors = Array.isArray(service['@ORD.successor']) 
                ? service['@ORD.successor'] 
                : [service['@ORD.successor']];
        }
        
        return enriched;
    }
}

module.exports = LifecycleProcessor;