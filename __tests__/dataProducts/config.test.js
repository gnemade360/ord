const { loadCustomConfiguration, mergeConfiguration, validateConfiguration } = require("../../lib/dataProducts/config");
const fs = require("fs");
const path = require("path");

jest.mock("fs");
jest.mock("@sap/cds", () => ({
    root: "/test/root"
}));

describe("DataProduct Configuration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    describe("loadCustomConfiguration", () => {
        it("should load custom configuration from file", () => {
            const mockConfig = {
                dataProducts: [{
                    id: "test:dataProduct:Custom:v1",
                    title: "Custom Data Product"
                }]
            };
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
            
            const result = loadCustomConfiguration("/path/to/config.json");
            
            expect(result).toEqual(mockConfig);
            expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/config.json", "utf8");
        });
        
        it("should return null if file does not exist", () => {
            fs.existsSync.mockReturnValue(false);
            
            const result = loadCustomConfiguration("/path/to/config.json");
            
            expect(result).toBeNull();
        });
        
        it("should handle JSON parsing errors", () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue("invalid json");
            
            const result = loadCustomConfiguration("/path/to/config.json");
            
            expect(result).toBeNull();
        });
    });
    
    describe("mergeConfiguration", () => {
        it("should return annotation data when no custom config", () => {
            const annotationData = [{
                id: "test:dataProduct:Service:v1",
                title: "Annotation Data Product"
            }];
            
            const result = mergeConfiguration(annotationData, null);
            
            expect(result).toEqual({
                dataProducts: annotationData,
                conflicts: []
            });
        });
        
        it("should override annotation with custom config", () => {
            const annotationData = [{
                id: "test:dataProduct:Service:v1",
                title: "Annotation Title",
                description: "Annotation Description",
                version: "1.0.0"
            }];
            
            const customConfig = {
                dataProducts: [{
                    id: "test:dataProduct:Service:v1",
                    title: "Custom Title",
                    version: "2.0.0"
                }]
            };
            
            const result = mergeConfiguration(annotationData, customConfig);
            
            expect(result.dataProducts[0]).toMatchObject({
                id: "test:dataProduct:Service:v1",
                title: "Custom Title", // Overridden
                description: "Annotation Description", // Kept from annotation
                version: "2.0.0", // Overridden
                source: "custom"
            });
            
            expect(result.conflicts).toHaveLength(1);
            expect(result.conflicts[0]).toMatchObject({
                dataProductId: "test:dataProduct:Service:v1",
                fields: expect.arrayContaining([
                    { field: "title", annotationValue: "Annotation Title", customValue: "Custom Title" },
                    { field: "version", annotationValue: "1.0.0", customValue: "2.0.0" }
                ])
            });
        });
        
        it("should ignore new data products from custom config", () => {
            const annotationData = [{
                id: "test:dataProduct:Service1:v1",
                title: "Service 1"
            }];
            
            const customConfig = {
                dataProducts: [{
                    id: "test:dataProduct:Service2:v1",
                    title: "Service 2"
                }]
            };
            
            const result = mergeConfiguration(annotationData, customConfig);
            
            // Should still have only 1 data product (Service2 ignored)
            expect(result.dataProducts).toHaveLength(1);
            expect(result.dataProducts[0].id).toBe("test:dataProduct:Service1:v1");
        });
    });
    
    describe("validateConfiguration", () => {
        it("should validate correct configuration", () => {
            const config = {
                id: "test:dataProduct:Service:v1",
                title: "Valid Data Product",
                version: "1.0.0",
                type: "primary",
                visibility: "public"
            };
            
            const errors = validateConfiguration(config);
            
            expect(errors).toHaveLength(0);
        });
        
        it("should return errors for invalid configuration", () => {
            const config = {
                // Missing id
                title: "Invalid Data Product",
                version: "invalid-version",
                type: "invalid-type",
                visibility: "invalid-visibility"
            };
            
            const errors = validateConfiguration(config);
            
            expect(errors).toContain("Data product ID is required");
            expect(errors).toContain("Valid semantic version is required (e.g., 1.0.0)");
            expect(errors).toContain("Type must be one of: primary, derived");
            expect(errors).toContain("Visibility must be one of: public, internal, private");
        });
    });
});