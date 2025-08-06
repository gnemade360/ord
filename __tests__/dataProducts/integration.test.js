const { processDataProducts, isDataProductsEnabled } = require("../../lib/dataProducts");
const fs = require("fs");

jest.mock("fs");
jest.mock("@sap/cds", () => ({
    root: "/test/root",
    env: {
        ord: {}
    }
}));

describe("DataProducts Integration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset environment
        delete process.env.ORD_ENABLE_DATA_PRODUCTS;
        require("@sap/cds").env.ord = {};
    });
    
    describe("isDataProductsEnabled", () => {
        it("should return true when environment variable is set", () => {
            process.env.ORD_ENABLE_DATA_PRODUCTS = "true";
            
            expect(isDataProductsEnabled()).toBe(true);
        });
        
        it("should return true when cds config is set", () => {
            require("@sap/cds").env.ord = {
                features: {
                    dataProducts: true
                }
            };
            
            expect(isDataProductsEnabled()).toBe(true);
        });
        
        it("should return false by default", () => {
            expect(isDataProductsEnabled()).toBe(false);
        });
    });
    
    describe("processDataProducts", () => {
        const appConfig = {
            ordNamespace: "com.example",
            packages: [{
                ordId: "com.example:package:default:v1"
            }]
        };
        
        it("should return empty array when feature is disabled", () => {
            const csn = {
                definitions: {
                    TestService: {
                        kind: "service",
                        "@ORD.dataProduct": {
                            title: "Test Data Product"
                        }
                    }
                }
            };
            
            const result = processDataProducts(csn, appConfig);
            
            expect(result).toEqual([]);
        });
        
        it("should create default data products for all services", () => {
            process.env.ORD_ENABLE_DATA_PRODUCTS = "true";
            fs.existsSync.mockReturnValue(false); // No custom config
            
            const csn = {
                definitions: {
                    CustomerService: {
                        kind: "service",
                        "@ORD.dataProduct": {
                            title: "Customer Data Product",
                            description: "Customer master data",
                            version: "1.0.0",
                            type: "primary",
                            visibility: "public"
                        }
                    },
                    PlainService: {
                        kind: "service"
                        // No annotations - should get defaults
                    }
                }
            };
            
            const result = processDataProducts(csn, appConfig);
            
            expect(result).toHaveLength(2);
            
            // Annotated service
            expect(result[0]).toMatchObject({
                ordId: "com.example:dataProduct:CustomerService:v1",
                title: "Customer Data Product",
                description: "Customer master data",
                version: "1.0.0",
                type: "primary",
                visibility: "public",
                partOfPackage: "com.example:package:default:v1"
            });
            
            // Default service
            expect(result[1]).toMatchObject({
                ordId: "com.example:dataProduct:PlainService:v1",
                title: "PlainService",
                description: "Data product for PlainService",
                version: "1.0.0",
                type: "primary",
                visibility: "internal",
                partOfPackage: "com.example:package:default:v1"
            });
        });
        
        it("should merge custom configuration", () => {
            process.env.ORD_ENABLE_DATA_PRODUCTS = "true";
            
            const customConfig = {
                dataProducts: [{
                    id: "com.example:dataProduct:CustomerService:v1",
                    title: "Custom Title Override",
                    visibility: "internal"
                }]
            };
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(customConfig));
            
            const csn = {
                definitions: {
                    CustomerService: {
                        kind: "service",
                        "@ORD.dataProduct": {
                            title: "Original Title",
                            version: "1.0.0",
                            type: "primary",
                            visibility: "public"
                        }
                    }
                }
            };
            
            const result = processDataProducts(csn, appConfig);
            
            expect(result[0]).toMatchObject({
                title: "Custom Title Override", // Overridden
                visibility: "internal", // Overridden
                version: "1.0.0", // Kept from annotation
                type: "primary" // Kept from annotation
            });
        });
        
        it("should handle errors gracefully", () => {
            process.env.ORD_ENABLE_DATA_PRODUCTS = "true";
            
            // Mock an error in file reading
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error("File read error");
            });
            
            const csn = {
                definitions: {
                    TestService: {
                        kind: "service",
                        "@ORD.dataProduct": {
                            title: "Test"
                        }
                    }
                }
            };
            
            // Should not throw, just return empty array
            const result = processDataProducts(csn, appConfig);
            
            expect(result).toEqual([]);
        });
        
        it("should process complex scenario with entities and properties", () => {
            process.env.ORD_ENABLE_DATA_PRODUCTS = "true";
            fs.existsSync.mockReturnValue(false);
            
            const csn = {
                definitions: {
                    SalesService: {
                        kind: "service",
                        "@ORD.dataProduct": {
                            title: "Sales Analytics",
                            type: "derived",
                            visibility: "internal"
                        },
                        elements: {
                            Orders: {
                                kind: "entity",
                                target: "SalesService.Orders"
                            },
                            OrderCreated: {
                                kind: "event"
                            }
                        }
                    },
                    "SalesService.Orders": {
                        kind: "entity",
                        "@ORD.schema": {
                            format: "application/json"
                        },
                        "@ORD.lineage": {
                            sources: ["s4.sales:Orders", "s4.finance:Invoices"]
                        },
                        elements: {
                            customerEmail: {
                                "@ORD.tag": { key: "PII", value: "true" }
                            },
                            orderValue: {
                                "@ORD.tag": { key: "financial", value: "true" }
                            }
                        }
                    }
                }
            };
            
            const result = processDataProducts(csn, appConfig);
            
            expect(result[0]).toMatchObject({
                title: "Sales Analytics",
                type: "derived",
                outputPorts: expect.arrayContaining([
                    { ordId: "com.example:apiResource:SalesService:v1" },
                    { ordId: "com.example:eventResource:SalesService:v1" }
                ]),
                lineage: {
                    sources: ["s4.sales:Orders", "s4.finance:Invoices"]
                },
                tags: expect.arrayContaining([
                    { key: "PII", value: "true" },
                    { key: "financial", value: "true" }
                ])
            });
        });
    });
});