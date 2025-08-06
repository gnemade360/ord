const BaseProcessor = require('./BaseProcessor');
const { Logger } = require('../../logger');

class GovernanceProcessor extends BaseProcessor {
    process(dataProducts, context) {
        Logger.info(`Applying governance fields to ${dataProducts.length} data products`);
        
        return dataProducts.map(dp => {
            try {
                return this.enrichWithGovernanceFields(dp, context);
            } catch (error) {
                this.handleError(error, `governance enrichment for ${dp.id}`);
                return dp;
            }
        });
    }
    
    enrichWithGovernanceFields(dp, context) {
        const { csn } = context;
        const service = csn.definitions[dp.serviceName];
        
        if (!service) return dp;
        
        const enriched = { ...dp };
        
        // Check for governance annotations
        if (service['@ORD.governance']) {
            const governance = service['@ORD.governance'];
            
            // Policy level
            if (governance.policyLevel) {
                enriched.policyLevel = governance.policyLevel;
            }
            
            // System instance aware
            if (typeof governance.systemInstanceAware === 'boolean') {
                enriched.systemInstanceAware = governance.systemInstanceAware;
            }
            
            // Custom policy levels
            if (governance.customPolicyLevel) {
                enriched.customPolicyLevel = governance.customPolicyLevel;
            }
        }
        
        // Check for individual governance annotations
        if (service['@ORD.policyLevel'] && !enriched.policyLevel) {
            enriched.policyLevel = service['@ORD.policyLevel'];
        }
        
        if (typeof service['@ORD.systemInstanceAware'] === 'boolean' && 
            enriched.systemInstanceAware === undefined) {
            enriched.systemInstanceAware = service['@ORD.systemInstanceAware'];
        }
        
        // Check for compliance and security annotations
        if (service['@ORD.compliance']) {
            if (!enriched.labels) enriched.labels = {};
            enriched.labels['compliance'] = Array.isArray(service['@ORD.compliance'])
                ? service['@ORD.compliance']
                : [service['@ORD.compliance']];
        }
        
        if (service['@ORD.dataClassification']) {
            if (!enriched.labels) enriched.labels = {};
            enriched.labels['data-classification'] = [service['@ORD.dataClassification']];
        }
        
        // Additional governance metadata
        if (service['@ORD.dataRetention']) {
            if (!enriched.documentationLabels) enriched.documentationLabels = {};
            enriched.documentationLabels['Data Retention'] = [service['@ORD.dataRetention']];
        }
        
        if (service['@ORD.personalData']) {
            if (!enriched.labels) enriched.labels = {};
            enriched.labels['personal-data'] = [String(service['@ORD.personalData'])];
        }
        
        return enriched;
    }
}

module.exports = GovernanceProcessor;