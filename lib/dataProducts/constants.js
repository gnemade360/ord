// Constants for data products
const { RESOURCE_VISIBILITY, DATA_PRODUCT_TYPE } = require("../constants");

// Data product specific annotations - using @ORD. prefix (not @ORD.Extensions.)
const ANNOTATIONS = {
    DATA_PRODUCT: "@ORD.dataProduct",
    SCHEMA: "@ORD.schema",
    LINEAGE: "@ORD.lineage",
    TAG: "@ORD.tag"
};

const DEFAULTS = {
    VERSION: "1.0.0",
    TYPE: DATA_PRODUCT_TYPE.primary,
    VISIBILITY: RESOURCE_VISIBILITY.internal,
    RELEASE_STATUS: "active",
    CATEGORY: "business-object",
    RESPONSIBLE: "sap:ach:CIC-DP-CO"
};

// Additional data product types beyond what's in main constants
const VALID_TYPES = [DATA_PRODUCT_TYPE.primary, "derived"];

// Track data product processing source
const SOURCE_TYPES = {
    DEFAULT: "default",
    ANNOTATED: "annotated",
    CUSTOM: "custom"
};

module.exports = {
    ANNOTATIONS,
    DEFAULTS,
    VALID_TYPES,
    SOURCE_TYPES
};