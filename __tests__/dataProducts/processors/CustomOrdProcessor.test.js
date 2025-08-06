const CustomOrdProcessor = require("../../../lib/dataProducts/processors/CustomOrdProcessor");
const fs = require("fs");

jest.mock("fs");

describe("CustomOrdProcessor", () => {
    let processor;
    
    beforeEach(() => {
        processor = new CustomOrdProcessor();
        jest.clearAllMocks();
    });
    
    it("should merge custom configuration for matching IDs", async () => {
        const dataProducts = [{
            id: "com.example:dataProduct:CustomerService:v1",
            title: "CustomerService",
            description: "Default description",
            source: "annotated"
        }];
        
        const customConfig = {
            dataProducts: [{
                id: "com.example:dataProduct:CustomerService:v1",
                title: "Custom Title",
                responsible: "custom-team@company.com"
            }]
        };
        
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(customConfig));
        
        const context = {
            customConfigPath: "/path/to/custom.ord.json"
        };
        
        const result = await processor.process(dataProducts, context);
        
        expect(result[0]).toMatchObject({
            id: "com.example:dataProduct:CustomerService:v1",
            title: "Custom Title",
            description: "Default description",
            responsible: "custom-team@company.com",
            source: "custom"
        });
    });
    
    it("should ignore custom data products without matching services", async () => {
        const dataProducts = [{
            id: "com.example:dataProduct:ExistingService:v1",
            title: "ExistingService"
        }];
        
        const customConfig = {
            dataProducts: [
                {
                    id: "com.example:dataProduct:ExistingService:v1",
                    title: "Updated Title"
                },
                {
                    id: "com.example:dataProduct:NonExistingService:v1",
                    title: "Should be ignored"
                }
            ]
        };
        
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(customConfig));
        
        const context = {
            customConfigPath: "/path/to/custom.ord.json"
        };
        
        const result = await processor.process(dataProducts, context);
        
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("Updated Title");
    });
    
    it("should return original data products if no custom config exists", async () => {
        const dataProducts = [{
            id: "com.example:dataProduct:Service:v1",
            title: "Original Title"
        }];
        
        fs.existsSync.mockReturnValue(false);
        
        const context = {
            customConfigPath: "/path/to/custom.ord.json"
        };
        
        const result = await processor.process(dataProducts, context);
        
        expect(result).toEqual(dataProducts);
    });
});