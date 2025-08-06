const BaseProcessor = require('./BaseProcessor');
const { Logger } = require('../../logger');

class DataProductLinksProcessor extends BaseProcessor {
    process(dataProducts, context) {
        Logger.info(`Processing data product links for ${dataProducts.length} data products`);
        
        return dataProducts.map(dp => {
            try {
                return this.enrichWithDataProductLinks(dp, context);
            } catch (error) {
                this.handleError(error, `data product links processing for ${dp.id}`);
                return dp;
            }
        });
    }
    
    enrichWithDataProductLinks(dp, context) {
        const { csn } = context;
        const service = csn.definitions[dp.serviceName];
        
        if (!service) return dp;
        
        const enriched = { ...dp };
        
        // Process dataProductLinks (specific to data products)
        if (service['@ORD.dataProductLinks']) {
            enriched.dataProductLinks = this.processDataProductLinks(service['@ORD.dataProductLinks']);
        }
        
        // Process general links
        if (service['@ORD.links']) {
            enriched.links = this.processGeneralLinks(service['@ORD.links']);
        }
        
        // Check for specific link type annotations
        const linkTypes = ['support', 'payment', 'service-level-agreement', 'custom'];
        const dataProductLinks = [];
        
        linkTypes.forEach(type => {
            const annotation = `@ORD.${type}Link`;
            if (service[annotation]) {
                const link = {
                    type,
                    url: service[annotation]
                };
                
                // Handle custom type details
                if (type === 'custom' && service['@ORD.customLinkType']) {
                    link.customType = service['@ORD.customLinkType'];
                }
                
                dataProductLinks.push(link);
            }
        });
        
        if (dataProductLinks.length > 0) {
            enriched.dataProductLinks = [
                ...(enriched.dataProductLinks || []),
                ...dataProductLinks
            ];
        }
        
        return enriched;
    }
    
    processDataProductLinks(links) {
        if (!links) return undefined;
        
        const processed = [];
        const linkArray = Array.isArray(links) ? links : [links];
        
        linkArray.forEach(link => {
            if (typeof link === 'string') {
                // Simple URL string - default to support type
                processed.push({
                    type: 'support',
                    url: link
                });
            } else if (typeof link === 'object' && link.url) {
                const processedLink = {
                    type: link.type || 'support',
                    url: link.url
                };
                
                if (link.type === 'custom' && link.customType) {
                    processedLink.customType = link.customType;
                }
                
                processed.push(processedLink);
            }
        });
        
        return processed.length > 0 ? processed : undefined;
    }
    
    processGeneralLinks(links) {
        if (!links) return undefined;
        
        const processed = [];
        const linkArray = Array.isArray(links) ? links : [links];
        
        linkArray.forEach(link => {
            if (typeof link === 'string') {
                // Simple URL string
                processed.push({
                    url: link,
                    title: 'Related Link',
                    description: ''
                });
            } else if (typeof link === 'object' && link.url) {
                processed.push({
                    title: link.title || 'Related Link',
                    description: link.description || '',
                    url: link.url
                });
            }
        });
        
        return processed.length > 0 ? processed : undefined;
    }
}

module.exports = DataProductLinksProcessor;