const AnnotationsProcessor = require("../../../lib/dataProducts/processors/AnnotationsProcessor");

describe("AnnotationsProcessor", () => {
    let processor;
    
    beforeEach(() => {
        processor = new AnnotationsProcessor();
    });
    
    it("should apply service annotations", async () => {
        const dataProducts = [{
            id: "com.example:dataProduct:CustomerService:v1",
            title: "CustomerService",
            serviceName: "CustomerService",
            source: "default",
            tags: []
        }];
        
        const context = {
            csn: {
                definitions: {
                    CustomerService: {
                        kind: "service",
                        "@ORD.dataProduct": {
                            title: "Customer Data Product",
                            description: "Customer master data",
                            type: "primary",
                            visibility: "public",
                            tags: [{ key: "domain", value: "customer" }]
                        }
                    }
                }
            }
        };
        
        const result = await processor.process(dataProducts, context);
        
        expect(result[0]).toMatchObject({
            title: "Customer Data Product",
            description: "Customer master data",
            type: "primary",
            visibility: "public",
            tags: [{ key: "domain", value: "customer" }],
            source: "annotated"
        });
    });
    
    it("should extract entity annotations", async () => {
        const dataProducts = [{
            id: "com.example:dataProduct:SalesService:v1",
            serviceName: "SalesService",
            source: "default",
            tags: []
        }];
        
        const context = {
            csn: {
                definitions: {
                    SalesService: {
                        kind: "service",
                        elements: {
                            Orders: {
                                kind: "entity",
                                target: "SalesService.Orders"
                            }
                        }
                    },
                    "SalesService.Orders": {
                        kind: "entity",
                        "@ORD.schema": { format: "application/json" },
                        "@ORD.lineage": { sources: ["s4.sales:Orders"] },
                        elements: {
                            customerEmail: {
                                "@ORD.tag": { key: "PII", value: "true" }
                            }
                        }
                    }
                }
            }
        };
        
        const result = await processor.process(dataProducts, context);
        
        expect(result[0]).toMatchObject({
            schema: { format: "application/json" },
            lineage: { sources: ["s4.sales:Orders"] },
            tags: [{ key: "PII", value: "true" }],
            source: "annotated"
        });
    });
    
    it("should handle missing service gracefully", async () => {
        const dataProducts = [{
            id: "com.example:dataProduct:MissingService:v1",
            serviceName: "MissingService",
            source: "default"
        }];
        
        const context = {
            csn: { definitions: {} }
        };
        
        const result = await processor.process(dataProducts, context);
        
        expect(result[0].source).toBe("default");
    });
});