const { extractDataProductsFromModel } = require("../../lib/dataProducts/processor");

describe("DataProduct Processor", () => {
    const namespace = "com.example";
    
    it("should process service with data product annotation", () => {
        const csn = {
            definitions: {
                CustomerService: {
                    kind: "service",
                    "@ORD.dataProduct": {
                        title: "Customer Data Product",
                        description: "Customer master data and analytics",
                        version: "1.0.0",
                        type: "primary",
                        visibility: "public",
                        tags: [
                            { key: "domain", value: "customer" }
                        ]
                    }
                }
            }
        };
        
        const result = extractDataProductsFromModel(csn, namespace);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            id: "com.example:dataProduct:CustomerService:v1",
            title: "Customer Data Product",
            description: "Customer master data and analytics",
            version: "1.0.0",
            type: "primary",
            visibility: "public",
            serviceName: "CustomerService",
            tags: [{ key: "domain", value: "customer" }],
            source: "annotated"
        });
    });
    
    it("should use defaults for missing annotation properties", () => {
        const csn = {
            definitions: {
                OrderService: {
                    kind: "service",
                    "@ORD.dataProduct": {
                        title: "Order Data"
                    }
                }
            }
        };
        
        const result = extractDataProductsFromModel(csn, namespace);
        
        expect(result[0]).toMatchObject({
            id: "com.example:dataProduct:OrderService:v1",
            title: "Order Data",
            description: "Description for OrderService",
            version: "1.0.0",
            type: "primary",
            visibility: "internal"
        });
    });
    
    it("should create default data products for all services", () => {
        const csn = {
            definitions: {
                RegularService: {
                    kind: "service"
                },
                DataProductService: {
                    kind: "service",
                    "@ORD.dataProduct": {
                        title: "Test Data Product"
                    }
                }
            }
        };
        
        const result = extractDataProductsFromModel(csn, namespace);
        
        expect(result).toHaveLength(2);
        
        // First service has defaults
        expect(result.find(dp => dp.serviceName === "RegularService")).toMatchObject({
            title: "RegularService",
            description: "Description for RegularService",
            source: "default"
        });
        
        // Second service has annotation overrides
        expect(result.find(dp => dp.serviceName === "DataProductService")).toMatchObject({
            title: "Test Data Product",
            source: "annotated"
        });
    });
    
    it("should process entity annotations", () => {
        const csn = {
            definitions: {
                SalesService: {
                    kind: "service",
                    "@ORD.dataProduct": {
                        title: "Sales Data Product"
                    },
                    elements: {
                        Orders: {
                            kind: "entity",
                            target: "SalesService.Orders"
                        }
                    }
                },
                "SalesService.Orders": {
                    kind: "entity",
                    "@ORD.schema": {
                        format: "application/json"
                    },
                    "@ORD.lineage": {
                        sources: ["s4.sales:Orders"]
                    },
                    elements: {
                        customerEmail: {
                            "@ORD.tag": { key: "PII", value: "true" }
                        }
                    }
                }
            }
        };
        
        const result = extractDataProductsFromModel(csn, namespace);
        
        expect(result[0]).toMatchObject({
            schema: { format: "application/json" },
            lineage: { sources: ["s4.sales:Orders"] },
            tags: expect.arrayContaining([
                { key: "PII", value: "true" }
            ])
        });
    });
    
    it("should handle various tag formats", () => {
        const csn = {
            definitions: {
                ProductService: {
                    kind: "service",
                    "@ORD.dataProduct": {
                        title: "Product Data",
                        tags: {
                            domain: "product",
                            quality: "gold"
                        }
                    }
                }
            }
        };
        
        const result = extractDataProductsFromModel(csn, namespace);
        
        expect(result[0].tags).toEqual([
            { key: "domain", value: "product" },
            { key: "quality", value: "gold" }
        ]);
    });
    
    it("should handle errors gracefully", () => {
        const csn = {
            definitions: {
                BrokenService: {
                    kind: "service",
                    "@ORD.dataProduct": {
                        title: "Broken Data Product",
                        type: "invalid-type" // This should be caught
                    }
                }
            }
        };
        
        const result = extractDataProductsFromModel(csn, namespace);
        
        // Should still process but with valid defaults
        expect(result[0].type).toBe("primary");
    });
});