const DefaultsProcessor = require("../../../lib/dataProducts/processors/DefaultsProcessor");

describe("DefaultsProcessor", () => {
    let processor;
    
    beforeEach(() => {
        processor = new DefaultsProcessor();
    });
    
    it("should create default data products for all services", async () => {
        const context = {
            csn: {
                definitions: {
                    CustomerService: { kind: "service" },
                    OrderService: { kind: "service" },
                    SomeEntity: { kind: "entity" }
                }
            },
            namespace: "com.example"
        };
        
        const result = await processor.process([], context);
        
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
            id: "com.example:dataProduct:CustomerService:v1",
            title: "CustomerService",
            description: "Description for CustomerService",
            version: "1.0.0",
            type: "primary",
            visibility: "internal",
            serviceName: "CustomerService",
            tags: [],
            source: "default"
        });
        expect(result[1].serviceName).toBe("OrderService");
    });
    
    it("should handle empty CSN", async () => {
        const context = {
            csn: { definitions: {} },
            namespace: "com.example"
        };
        
        const result = await processor.process([], context);
        
        expect(result).toHaveLength(0);
    });
    
    it("should pass to next processor in chain", async () => {
        const mockNext = {
            handle: jest.fn().mockResolvedValue([{ modified: true }])
        };
        processor.setNext(mockNext);
        
        const context = {
            csn: { definitions: { TestService: { kind: "service" } } },
            namespace: "com.example"
        };
        
        const result = await processor.handle([], context);
        
        expect(mockNext.handle).toHaveBeenCalled();
        expect(result).toEqual([{ modified: true }]);
    });
});