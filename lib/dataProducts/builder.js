const { Logger } = require("../logger");
const { CONTENT_MERGE_KEY } = require("../constants");

function buildDataProduct(config, csn) {
    
    // Basic structure following ORD spec
    const dataProduct = {
        ordId: config.id,
        localId: config.localId || config.serviceName,
        title: config.title,
        shortDescription: config.description || config.title,
        description: config.description || config.title,
        version: config.version,
        releaseStatus: config.releaseStatus || "active",
        visibility: config.visibility,
        partOfPackage: config.partOfPackage,
        responsible: config.responsible || "sap:ach:CIC-DP-CO",
        type: config.type,
        category: config.category || "business-object",
        outputPorts: [],
        inputPorts: config.inputPorts || [],
        [CONTENT_MERGE_KEY]: config.id
    };
    
    // Add optional fields using a more elegant approach
    const optionalFields = {
        // Taxonomy fields
        tags: config.tags?.length > 0 ? config.tags : undefined,
        industry: config.industry?.length > 0 ? config.industry : undefined,
        lineOfBusiness: config.lineOfBusiness?.length > 0 ? config.lineOfBusiness : undefined,
        countries: config.countries?.length > 0 ? config.countries : undefined,
        labels: config.labels,
        documentationLabels: config.documentationLabels,
        correlationIds: config.correlationIds?.length > 0 ? config.correlationIds : undefined,
        
        // Lifecycle fields
        lifecycleStatus: config.lifecycleStatus,
        deprecationDate: config.deprecationDate,
        sunsetDate: config.sunsetDate,
        successors: config.successors?.length > 0 ? config.successors : undefined,
        changelogEntries: config.changelogEntries?.length > 0 ? config.changelogEntries : undefined,
        lastUpdate: config.lastUpdate,
        
        // Governance fields
        policyLevel: config.policyLevel,
        customPolicyLevel: config.customPolicyLevel,
        systemInstanceAware: config.systemInstanceAware,
        
        // Links
        dataProductLinks: config.dataProductLinks?.length > 0 ? config.dataProductLinks : undefined,
        links: config.links?.length > 0 ? config.links : undefined,
        
        // Other fields
        lineage: config.lineage,
        entityTypes: config.entityTypes?.length > 0 ? config.entityTypes : undefined,
        additionalDetails: config.additionalDetails
    };
    
    // Only add fields that have values
    Object.entries(optionalFields).forEach(([key, value]) => {
        if (value !== undefined) {
            dataProduct[key] = value;
        }
    });
    
    // Generate output ports if service name is provided
    if (config.serviceName && csn) {
        dataProduct.outputPorts = generateOutputPorts(config.serviceName, csn, config.id);
    }
    
    // Use provided output ports if any
    if (config.outputPorts && config.outputPorts.length > 0) {
        dataProduct.outputPorts = config.outputPorts;
    }
    
    // Validate the built product
    const errors = validateDataProduct(dataProduct);
    if (errors.length > 0) {
        const errorMessage = `Data product ${config.id} has validation errors: ${errors.join(", ")}`;
        Logger.error(errorMessage);
        throw new Error(errorMessage);
    }
    
    return dataProduct;
}

function generateOutputPorts(serviceName, csn, dataProductId) {
    const ports = [];
    const service = csn.definitions[serviceName];
    
    if (!service) {
        return ports;
    }
    
    // Generate OData V4 port
    const namespace = dataProductId.split(":")[0];
    const apiResourceId = `${namespace}:apiResource:${serviceName}:v1`;
    
    ports.push({
        ordId: apiResourceId
    });
    
    // Check if service has events and add event port
    const hasEvents = Object.values(service.elements || {}).some(elem => 
        elem.kind === "event" || (elem.target && csn.definitions[elem.target]?.kind === "event")
    );
    
    if (hasEvents) {
        const eventResourceId = `${namespace}:eventResource:${serviceName}:v1`;
        ports.push({
            ordId: eventResourceId
        });
    }
    
    return ports;
}

function validateDataProduct(dataProduct) {
    const errors = [];
    
    // Required fields
    if (!dataProduct.ordId) errors.push("ordId is required");
    if (!dataProduct.title) errors.push("title is required");
    if (!dataProduct.version) errors.push("version is required");
    if (!dataProduct.type) errors.push("type is required");
    if (!dataProduct.visibility) errors.push("visibility is required");
    if (!dataProduct.responsible) errors.push("responsible is required");
    if (!dataProduct.outputPorts || dataProduct.outputPorts.length === 0) {
        errors.push("at least one output port is required");
    }
    
    return errors;
}

function buildDataProducts(mergedData, csn, packageInfo) {
    const dataProducts = [];
    
    mergedData.forEach(config => {
        try {
            // Add package info if not provided
            if (!config.partOfPackage && packageInfo) {
                config.partOfPackage = packageInfo.ordId;
            }
            
            const dataProduct = buildDataProduct(config, csn);
            dataProducts.push(dataProduct);
        } catch (error) {
            Logger.error(`Failed to build data product ${config.id}: ${error.message}`);
        }
    });
    
    return dataProducts;
}

module.exports = {
    buildDataProduct,
    buildDataProducts,
    generateOutputPorts,
    validateDataProduct
};