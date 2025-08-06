const { createDataProductProcessor } = require("../../../../lib/dataProducts/processors/processor");
const DefaultsProcessor = require("../../../../lib/dataProducts/processors/DefaultsProcessor");
const AnnotationsProcessor = require("../../../../lib/dataProducts/processors/AnnotationsProcessor");
const LifecycleProcessor = require("../../../../lib/dataProducts/processors/LifecycleProcessor");
const TaxonomyProcessor = require("../../../../lib/dataProducts/processors/TaxonomyProcessor");
const EntityTypesProcessor = require("../../../../lib/dataProducts/processors/EntityTypesProcessor");
const InputPortsProcessor = require("../../../../lib/dataProducts/processors/InputPortsProcessor");
const DataProductLinksProcessor = require("../../../../lib/dataProducts/processors/DataProductLinksProcessor");
const GovernanceProcessor = require("../../../../lib/dataProducts/processors/GovernanceProcessor");

describe("All Data Product Processors", () => {
    const namespace = "com.example";
    
    const mockCsn = {
        definitions: {
            CustomerService: {
                kind: "service",
                "@ORD.dataProduct": {
                    title: "Customer 360",
                    description: "Complete customer data",
                    type: "primary",
                    visibility: "public"
                },
                "@ORD.lifecycle": {
                    releaseStatus: "active",
                    lifecycleStatus: "active",
                    lastUpdate: "2024-01-15T10:00:00Z",
                    changelogEntries: [{
                        date: "2024-01-15",
                        version: "2.0.0",
                        description: "Added analytics",
                        releaseStatus: "active"
                    }]
                },
                "@ORD.taxonomy": {
                    industry: ["Retail", "Consumer Products"],
                    lineOfBusiness: ["Sales"],
                    countries: ["DE", "US"]
                },
                "@ORD.labels": {
                    "compliance": ["GDPR", "CCPA"]
                },
                "@ORD.governance": {
                    policyLevel: "sap:core:v1",
                    systemInstanceAware: true
                },
                "@ORD.dataProductLinks": [{
                    type: "support",
                    url: "https://support.example.com"
                }],
                elements: {
                    Customers: {
                        kind: "entity",
                        target: "CustomerService.Customers"
                    }
                }
            },
            "CustomerService.Customers": {
                kind: "entity",
                "@ORD.entityType": "com.example:entityType:Customer:v1"
            },
            OrderIntelligenceService: {
                kind: "service",
                "@ORD.dataProduct": {
                    title: "Order Intelligence",
                    type: "derived"
                },
                "@ORD.inputPorts": [
                    "com.example:integrationDependency:MarketData:v1"
                ]
            }
        }
    };
    
    const context = {
        csn: mockCsn,
        namespace
    };
    
    describe("Processor Chain", () => {
        it("should process all fields through the complete chain", async () => {
            const processor = createDataProductProcessor();
            const result = await processor.process(context);
            
            expect(result).toHaveLength(2);
            
            // Check CustomerService data product
            const customerDP = result.find(dp => dp.serviceName === "CustomerService");
            expect(customerDP).toBeDefined();
            
            // From DefaultsProcessor
            expect(customerDP.localId).toBe("CustomerService");
            expect(customerDP.category).toBe("business-object");
            
            // From AnnotationsProcessor
            expect(customerDP.title).toBe("Customer 360");
            expect(customerDP.visibility).toBe("public");
            
            // From LifecycleProcessor
            expect(customerDP.releaseStatus).toBe("active");
            expect(customerDP.lifecycleStatus).toBe("active");
            expect(customerDP.lastUpdate).toBe("2024-01-15T10:00:00.000Z");
            expect(customerDP.changelogEntries).toHaveLength(1);
            
            // From TaxonomyProcessor
            expect(customerDP.industry).toEqual(["Retail", "Consumer Products"]);
            expect(customerDP.lineOfBusiness).toEqual(["Sales"]);
            expect(customerDP.countries).toEqual(["DE", "US"]);
            expect(customerDP.labels.compliance).toEqual(["GDPR", "CCPA"]);
            
            // From EntityTypesProcessor
            expect(customerDP.entityTypes).toContain("com.example:entityType:Customer:v1");
            
            // From GovernanceProcessor
            expect(customerDP.policyLevel).toBe("sap:core:v1");
            expect(customerDP.systemInstanceAware).toBe(true);
            
            // From DataProductLinksProcessor
            expect(customerDP.dataProductLinks).toHaveLength(1);
            expect(customerDP.dataProductLinks[0].type).toBe("support");
        });
        
        it("should handle input ports for derived data products", async () => {
            const processor = createDataProductProcessor();
            const result = await processor.process(context);
            
            const orderDP = result.find(dp => dp.serviceName === "OrderIntelligenceService");
            expect(orderDP).toBeDefined();
            expect(orderDP.type).toBe("derived");
            expect(orderDP.inputPorts).toHaveLength(1);
            expect(orderDP.inputPorts[0].ordId).toBe("com.example:integrationDependency:MarketData:v1");
        });
    });
    
    describe("Individual Processors", () => {
        describe("LifecycleProcessor", () => {
            it("should handle all lifecycle fields", () => {
                const processor = new LifecycleProcessor();
                const dataProducts = [{
                    id: "test:dp:1",
                    serviceName: "CustomerService"
                }];
                
                const result = processor.process(dataProducts, context);
                expect(result[0].releaseStatus).toBe("active");
                expect(result[0].lifecycleStatus).toBe("active");
                expect(result[0].changelogEntries).toBeDefined();
            });
        });
        
        describe("TaxonomyProcessor", () => {
            it("should normalize country codes", () => {
                const processor = new TaxonomyProcessor();
                const dataProducts = [{
                    id: "test:dp:1",
                    serviceName: "CustomerService"
                }];
                
                const result = processor.process(dataProducts, context);
                expect(result[0].countries).toEqual(["DE", "US"]);
            });
        });
        
        describe("EntityTypesProcessor", () => {
            it("should auto-discover entity types", () => {
                const processor = new EntityTypesProcessor();
                const dataProducts = [{
                    id: "test:dp:1",
                    serviceName: "CustomerService"
                }];
                
                const result = processor.process(dataProducts, context);
                expect(result[0].entityTypes).toContain("com.example:entityType:Customer:v1");
            });
        });
        
        describe("InputPortsProcessor", () => {
            it("should normalize integration dependency IDs", () => {
                const processor = new InputPortsProcessor();
                const dataProducts = [{
                    id: "test:dp:1",
                    serviceName: "OrderIntelligenceService",
                    type: "derived"
                }];
                
                const result = processor.process(dataProducts, context);
                expect(result[0].inputPorts[0].ordId).toMatch(/integrationDependency/);
            });
        });
        
        describe("GovernanceProcessor", () => {
            it("should process governance fields", () => {
                const processor = new GovernanceProcessor();
                const dataProducts = [{
                    id: "test:dp:1",
                    serviceName: "CustomerService"
                }];
                
                const result = processor.process(dataProducts, context);
                expect(result[0].policyLevel).toBe("sap:core:v1");
                expect(result[0].systemInstanceAware).toBe(true);
            });
        });
    });
});