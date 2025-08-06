const { buildDataProduct, buildDataProducts, generateOutputPorts, validateDataProduct } = require("../../lib/dataProducts/builder");

describe("DataProduct Builder", () => {
    describe("buildDataProduct", () => {
        it("should build a complete data product", () => {
            const config = {
                id: "com.example:dataProduct:CustomerService:v1",
                title: "Customer Data Product",
                description: "Customer master data",
                version: "1.0.0",
                type: "primary",
                visibility: "public",
                serviceName: "CustomerService",
                partOfPackage: "com.example:package:default:v1",
                tags: [{ key: "domain", value: "customer" }]
            };
            
            const csn = {
                definitions: {
                    CustomerService: {
                        kind: "service"
                    }
                }
            };
            
            const result = buildDataProduct(config, csn);
            
            expect(result).toMatchObject({
                ordId: "com.example:dataProduct:CustomerService:v1",
                localId: "CustomerService",
                title: "Customer Data Product",
                shortDescription: "Customer master data",
                description: "Customer master data",
                version: "1.0.0",
                releaseStatus: "active",
                visibility: "public",
                type: "primary",
                category: "business-object",
                partOfPackage: "com.example:package:default:v1",
                tags: [{ key: "domain", value: "customer" }],
                outputPorts: expect.any(Array)
            });
        });
        
        it("should generate output ports for service", () => {
            const config = {
                id: "com.example:dataProduct:OrderService:v1",
                title: "Order Data Product",
                version: "1.0.0",
                type: "primary",
                visibility: "internal",
                serviceName: "OrderService"
            };
            
            const csn = {
                definitions: {
                    OrderService: {
                        kind: "service",
                        elements: {
                            OrderCreated: {
                                kind: "event"
                            }
                        }
                    }
                }
            };
            
            const result = buildDataProduct(config, csn);
            
            expect(result.outputPorts).toHaveLength(2);
            expect(result.outputPorts[0]).toEqual({
                ordId: "com.example:apiResource:OrderService:v1"
            });
            expect(result.outputPorts[1]).toEqual({
                ordId: "com.example:eventResource:OrderService:v1"
            });
        });
        
        it("should use provided output ports over generated ones", () => {
            const config = {
                id: "com.example:dataProduct:Service:v1",
                title: "Data Product",
                version: "1.0.0",
                type: "primary",
                visibility: "internal",
                outputPorts: [{
                    ordId: "custom:port:v1"
                }]
            };
            
            const result = buildDataProduct(config, {});
            
            expect(result.outputPorts).toHaveLength(1);
            expect(result.outputPorts[0]).toEqual({
                ordId: "custom:port:v1"
            });
        });
    });
    
    describe("generateOutputPorts", () => {
        it("should generate OData port for service", () => {
            const csn = {
                definitions: {
                    TestService: {
                        kind: "service"
                    }
                }
            };
            
            const ports = generateOutputPorts("TestService", csn, "com.example:dataProduct:TestService:v1");
            
            expect(ports).toHaveLength(1);
            expect(ports[0]).toEqual({
                ordId: "com.example:apiResource:TestService:v1"
            });
        });
        
        it("should add event port if service has events", () => {
            const csn = {
                definitions: {
                    EventService: {
                        kind: "service",
                        elements: {
                            DataChanged: {
                                kind: "event"
                            }
                        }
                    }
                }
            };
            
            const ports = generateOutputPorts("EventService", csn, "com.example:dataProduct:EventService:v1");
            
            expect(ports).toHaveLength(2);
            expect(ports[1]).toEqual({
                ordId: "com.example:eventResource:EventService:v1"
            });
        });
        
        it("should return empty array if service not found", () => {
            const csn = {
                definitions: {}
            };
            
            const ports = generateOutputPorts("NonExistentService", csn, "com.example:dataProduct:Service:v1");
            
            expect(ports).toHaveLength(0);
        });
    });
    
    describe("validateDataProduct", () => {
        it("should return no errors for valid data product", () => {
            const dataProduct = {
                ordId: "com.example:dataProduct:Service:v1",
                title: "Valid Data Product",
                version: "1.0.0",
                type: "primary",
                visibility: "public",
                responsible: "sap:ach:CIC-DP-CO",
                outputPorts: [{ ordId: "port:v1" }]
            };
            
            const errors = validateDataProduct(dataProduct);
            
            expect(errors).toHaveLength(0);
        });
        
        it("should return errors for invalid data product", () => {
            const dataProduct = {
                // Missing required fields
                title: "Invalid Data Product",
                outputPorts: []
            };
            
            const errors = validateDataProduct(dataProduct);
            
            expect(errors).toContain("ordId is required");
            expect(errors).toContain("version is required");
            expect(errors).toContain("type is required");
            expect(errors).toContain("visibility is required");
            expect(errors).toContain("responsible is required");
            expect(errors).toContain("at least one output port is required");
        });
    });
    
    describe("buildDataProducts", () => {
        it("should build multiple data products", () => {
            const mergedData = [
                {
                    id: "com.example:dataProduct:Service1:v1",
                    title: "Service 1",
                    version: "1.0.0",
                    type: "primary",
                    visibility: "public",
                    responsible: "sap:ach:CIC-DP-CO",
                    outputPorts: [{ ordId: "com.example:apiResource:Service1:v1" }]
                },
                {
                    id: "com.example:dataProduct:Service2:v1",
                    title: "Service 2",
                    version: "1.0.0",
                    type: "derived",
                    visibility: "internal",
                    responsible: "sap:ach:CIC-DP-CO",
                    outputPorts: [{ ordId: "com.example:apiResource:Service2:v1" }]
                }
            ];
            
            const packageInfo = {
                ordId: "com.example:package:default:v1"
            };
            
            const result = buildDataProducts(mergedData, {}, packageInfo);
            
            expect(result).toHaveLength(2);
            expect(result[0].partOfPackage).toBe("com.example:package:default:v1");
            expect(result[1].partOfPackage).toBe("com.example:package:default:v1");
        });
        
        it("should handle build errors gracefully", () => {
            const mergedData = [
                {
                    // Invalid data - missing required fields
                },
                {
                    id: "com.example:dataProduct:ValidService:v1",
                    title: "Valid Service",
                    version: "1.0.0",
                    type: "primary",
                    visibility: "public",
                    responsible: "sap:ach:CIC-DP-CO",
                    outputPorts: [{ ordId: "com.example:apiResource:ValidService:v1" }]
                }
            ];
            
            const result = buildDataProducts(mergedData, {}, {});
            
            // Should only build the valid one since invalid data products now throw errors
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Valid Service");
        });
    });
});