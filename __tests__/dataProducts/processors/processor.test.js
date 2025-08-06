const { DataProductProcessorChain, createDataProductProcessor } = require("../../../lib/dataProducts/processors/processor");
const fs = require("fs");

jest.mock("fs");

describe("DataProductProcessorChain", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false); // No custom config by default
    });
    
    it("should process data products through the entire chain", async () => {
        const processor = createDataProductProcessor();
        
        const context = {
            csn: {
                definitions: {
                    CustomerService: {
                        kind: "service",
                        "@ORD.dataProduct": {
                            title: "Customer Data Product",
                            visibility: "public"
                        }
                    }
                }
            },
            namespace: "com.example",
            customConfigPath: null
        };
        
        const result = await processor.process(context);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            id: "com.example:dataProduct:CustomerService:v1",
            title: "Customer Data Product",
            visibility: "public",
            source: "annotated"
        });
    });
    
    it("should handle chain with custom configuration", async () => {
        const customConfig = {
            dataProducts: [{
                id: "com.example:dataProduct:OrderService:v1",
                responsible: "order-team@company.com"
            }]
        };
        
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(customConfig));
        
        const processor = createDataProductProcessor();
        
        const context = {
            csn: {
                definitions: {
                    OrderService: {
                        kind: "service",
                        "@ORD.dataProduct": {
                            title: "Order Data Product"
                        }
                    }
                }
            },
            namespace: "com.example",
            customConfigPath: "/path/to/custom.ord.json"
        };
        
        const result = await processor.process(context);
        
        expect(result[0]).toMatchObject({
            title: "Order Data Product",
            responsible: "order-team@company.com",
            source: "custom"
        });
    });
    
    it("should handle errors gracefully", async () => {
        const processor = createDataProductProcessor();
        
        const context = {
            csn: null, // This will cause an error
            namespace: "com.example"
        };
        
        await expect(processor.process(context)).rejects.toThrow();
    });
});