// Utility functions for data products
const { DEFAULTS, VALID_TYPES } = require("./constants");
const { RESOURCE_VISIBILITY } = require("../constants");

function generateDataProductId(namespace, serviceName, version) {
    const versionSuffix = version ? `v${version.split('.')[0]}` : "v1";
    return `${namespace}:dataProduct:${serviceName}:${versionSuffix}`;
}

function validateType(type) {
    return VALID_TYPES.includes(type) ? type : DEFAULTS.TYPE;
}

function validateVisibility(visibility) {
    const validVisibilities = Object.values(RESOURCE_VISIBILITY);
    return validVisibilities.includes(visibility) ? visibility : DEFAULTS.VISIBILITY;
}

function processTags(tags) {
    if (!tags) return [];
    
    if (Array.isArray(tags)) {
        return tags.map(tag => {
            if (typeof tag === "string") {
                return { key: tag, value: "true" };
            }
            return { key: tag.key || tag, value: String(tag.value || "true") };
        });
    }
    
    if (typeof tags === "object") {
        return Object.entries(tags).map(([key, value]) => ({
            key,
            value: String(value)
        }));
    }
    
    return [];
}

function mergeUniqueTags(existingTags, newTags) {
    const tagMap = new Map();
    
    // Add existing tags
    existingTags.forEach(tag => tagMap.set(tag.key, tag));
    
    // Add new tags (won't override existing)
    newTags.forEach(tag => {
        if (!tagMap.has(tag.key)) {
            tagMap.set(tag.key, tag);
        }
    });
    
    return Array.from(tagMap.values());
}

function validateReleaseStatus(status) {
    const validStatuses = ['beta', 'active', 'deprecated', 'decommissioned'];
    return validStatuses.includes(status) ? status : null;
}

function validateDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
    } catch {
        return null;
    }
}

function mergeConfiguration(annotationData, customConfig) {
    const merged = [...annotationData];
    const conflicts = [];
    let mergedCount = 0;
    
    if (!customConfig || !customConfig.dataProducts) {
        return { dataProducts: merged, conflicts, mergedCount };
    }
    
    customConfig.dataProducts.forEach(customDP => {
        const existingIndex = merged.findIndex(dp => dp.id === customDP.id);
        
        if (existingIndex >= 0) {
            const existing = merged[existingIndex];
            const conflictFields = [];
            
            // Track which fields are being overridden
            Object.keys(customDP).forEach(key => {
                if (key !== "id" && existing[key] !== undefined && existing[key] !== customDP[key]) {
                    conflictFields.push({
                        field: key,
                        previousValue: existing[key],
                        customValue: customDP[key]
                    });
                }
            });
            
            if (conflictFields.length > 0) {
                conflicts.push({
                    dataProductId: customDP.id,
                    fields: conflictFields
                });
            }
            
            // Merge with custom config taking precedence
            merged[existingIndex] = {
                ...existing,
                ...customDP,
                source: customDP.source || "custom"
            };
            mergedCount++;
        }
    });
    
    return { dataProducts: merged, conflicts, mergedCount };
}

module.exports = {
    generateDataProductId,
    validateType,
    validateVisibility,
    processTags,
    mergeUniqueTags,
    validateReleaseStatus,
    validateDate,
    mergeConfiguration
};