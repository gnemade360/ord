/**
 * DPD-specific constants
 */

const DPD_BUILD_DEFAULT_PATH = "gen/dpd";

const FOS_SCHEMA_URL = "https://github.tools.sap/bdc-fos/dp-metadata/blob/main/schemas/json/v2/DataProduct-v2.json";

const DPD_VALID_TYPES = ['primary', 'derived'];

const DPD_VALID_CATEGORIES = ['business-object', 'master-data', 'analytical', 'event'];

const DPD_VALID_VISIBILITY = ['internal', 'external', 'public'];

const DPD_DEFAULT_STATUS = 'active';

module.exports = {
    DPD_BUILD_DEFAULT_PATH,
    FOS_SCHEMA_URL,
    DPD_VALID_TYPES,
    DPD_VALID_CATEGORIES,
    DPD_VALID_VISIBILITY,
    DPD_DEFAULT_STATUS
};