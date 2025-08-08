const { Logger } = require("../../logger");
const { getRFC3339Date } = require("../../date");

/**
 * Build a DPD (Data Product Descriptor) according to FOS V2 schema
 * @param {object} config - Data product configuration from annotations
 * @param {object} csn - Compiled Service Network
 * @param {object} appConfig - Application configuration
 * @returns {object} - DPD object following FOS schema
 */
function buildDpd(config, csn, appConfig) {
    const namespace = appConfig?.ordNamespace || "customer.sample";
    const timestamp = getRFC3339Date();
    
    // Build base DPD structure following FOS V2 schema
    const dpd = {
        "$schema": "https://github.tools.sap/bdc-fos/dp-metadata/blob/main/schemas/json/v2/DataProduct-v2.json",
        "name": config.name,
        "version": config.version,
        "title": config.title,
        "description": config.description,
        "type": config.type,
        "visibility": config.visibility || "internal",
        "category": config.category || "business-object",
        "status": config.lifecycle?.status || "active",
        "lastModified": timestamp,
        "namespace": namespace,
        "ordId": `${namespace}:dataProduct:${config.name}:v${config.version.split('.')[0]}`
    };
    
    // Add governance properties
    if (config.governance) {
        dpd.governance = {
            policyLevel: config.governance.policyLevel,
            dataClassification: config.governance.dataClassification || "internal"
        };
    }
    
    // Add compliance
    if (config.compliance && config.compliance.length > 0) {
        dpd.compliance = config.compliance;
    }
    
    // Add industry classification
    if (config.industry && config.industry.length > 0) {
        dpd.industry = config.industry;
    }
    
    // Add line of business
    if (config.lineOfBusiness && config.lineOfBusiness.length > 0) {
        dpd.lineOfBusiness = config.lineOfBusiness;
    }
    
    // Add countries
    if (config.countries && config.countries.length > 0) {
        dpd.countries = config.countries;
    }
    
    // Add labels
    if (config.labels) {
        dpd.labels = config.labels;
    }
    
    // Add tags
    if (config.tags && config.tags.length > 0) {
        dpd.tags = config.tags;
    }
    
    // Add correlation IDs
    if (config.correlationIds && config.correlationIds.length > 0) {
        dpd.correlationIds = config.correlationIds;
    }
    
    // Add data protection properties
    if (config.personalData !== undefined) {
        dpd.personalData = config.personalData;
    }
    
    if (config.dataRetention) {
        dpd.dataRetention = config.dataRetention;
    }
    
    if (config.dataClassification) {
        dpd.dataClassification = config.dataClassification;
    }
    
    // Add system instance aware flag
    if (config.systemInstanceAware !== undefined) {
        dpd.systemInstanceAware = config.systemInstanceAware;
    }
    
    // Add documentation labels
    if (config.documentationLabels) {
        dpd.documentationLabels = config.documentationLabels;
    }
    
    // Add links
    if (config.links && config.links.length > 0) {
        dpd.links = config.links.map(link => ({
            type: link.type || "related",
            title: link.title || "",
            description: link.description || "",
            url: link.url
        }));
    }
    
    // Add taxonomy if present
    if (config.taxonomy) {
        dpd.taxonomy = config.taxonomy;
    }
    
    // Handle input/output ports based on data product type
    if (config.type === "primary") {
        // Primary data products can have datasets and datasources
        dpd.dependsOn = {
            datasets: [],
            datasources: []
        };
        
        // Extract entities from the service as datasets
        const serviceDef = csn.definitions[config.name];
        if (serviceDef && serviceDef.entities) {
            Object.keys(serviceDef.entities).forEach(entityName => {
                dpd.dependsOn.datasets.push({
                    name: entityName,
                    type: "entity",
                    description: `Entity ${entityName} from ${config.name}`
                });
            });
        }
    } else if (config.type === "derived") {
        // Derived data products have input ports and can have transformers
        dpd.derivedDataProductProperties = {
            inputPorts: [],
            transformer: null
        };
        
        if (config.inputPorts && config.inputPorts.length > 0) {
            dpd.derivedDataProductProperties.inputPorts = config.inputPorts.map(port => ({
                ordId: port.ordId || port,
                type: port.type || "api"
            }));
        }
        
        // Add data product links as dependencies
        if (config.dataProductLinks && config.dataProductLinks.length > 0) {
            dpd.derivedDataProductProperties.dependencies = config.dataProductLinks.map(link => ({
                type: link.type || "source",
                ordId: link.ordId
            }));
        }
    }
    
    // Add lifecycle dates if present
    if (config.lifecycle) {
        if (config.lifecycle.deprecationDate) {
            dpd.deprecationDate = config.lifecycle.deprecationDate;
        }
        if (config.lifecycle.sunsetDate) {
            dpd.sunsetDate = config.lifecycle.sunsetDate;
        }
        if (config.lifecycle.lastUpdate) {
            dpd.lastUpdate = config.lifecycle.lastUpdate;
        }
    }
    
    // Add responsible party (using ORD namespace as default)
    dpd.responsible = `sap:ach:${namespace.replace(/\./g, '-')}`;
    
    // Add output schema information if available
    const serviceDef = csn.definitions[config.name];
    if (serviceDef) {
        dpd.outputSchema = {
            type: "cds",
            entities: []
        };
        
        // Add entities as output schema
        if (serviceDef.entities) {
            Object.keys(serviceDef.entities).forEach(entityName => {
                dpd.outputSchema.entities.push({
                    name: entityName,
                    type: "entity"
                });
            });
        }
        
        // Add events if present
        if (serviceDef.events) {
            dpd.outputSchema.events = Object.keys(serviceDef.events).map(eventName => ({
                name: eventName,
                type: "event"
            }));
        }
    }
    
    return dpd;
}

module.exports = {
    buildDpd
};