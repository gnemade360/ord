using { Country, managed } from '@sap/cds/common';

namespace com.example.dataproducts;

// Example: Customer data product with all ORD features
@ORD.dataProduct: {
    title: 'Customer 360 Data Product',
    description: 'Comprehensive customer data including demographics, transactions, and analytics',
    type: 'primary',
    visibility: 'public',
    responsible: 'customer-team@company.com'
}
@ORD.lifecycle: {
    releaseStatus: 'active',
    lifecycleStatus: 'active',
    lastUpdate: '2024-01-15T10:00:00Z',
    changelogEntries: [{
        date: '2024-01-15',
        version: '2.0.0',
        description: 'Added real-time analytics',
        releaseStatus: 'active'
    }]
}
@ORD.taxonomy: {
    industry: ['Retail', 'Consumer Products'],
    lineOfBusiness: ['Sales', 'Marketing'],
    countries: ['DE', 'US', 'FR']
}
@ORD.labels: {
    'data-quality': ['certified', 'validated'],
    'compliance': ['GDPR', 'CCPA']
}
@ORD.documentationLabels: {
    'Data Retention': ['5 years'],
    'Update Frequency': ['Real-time']
}
@ORD.governance: {
    policyLevel: 'sap:core:v1',
    systemInstanceAware: true
}
@ORD.dataProductLinks: [{
    type: 'support',
    url: 'https://support.example.com/customer-360'
}, {
    type: 'service-level-agreement',
    url: 'https://sla.example.com/customer-360'
}]
@ORD.links: [{
    title: 'Customer 360 Documentation',
    description: 'Complete guide to using the Customer 360 data product',
    url: 'https://docs.example.com/customer-360'
}]
@ORD.correlationIds: ['sap.customer:360:v1']
service CustomerService {
    
    @ORD.entityType: 'com.example:entityType:Customer:v1'
    entity Customers : managed {
        key ID : UUID;
        
        @ORD.tag: { key: 'PII', value: 'name' }
        name : String(100);
        
        @ORD.tag: { key: 'PII', value: 'email' }
        email : String(255);
        
        @ORD.tag: { key: 'PII', value: 'phone' }
        phone : String(30);
        
        customerSegment : String(50);
        lifetimeValue : Decimal(15,2);
        registrationDate : Date;
        country : Country;
        
        orders : Association to many Orders on orders.customer = $self;
        analytics : Association to CustomerAnalytics on analytics.customer = $self;
    }
    
    @ORD.entityType: 'com.example:entityType:Order:v1'
    entity Orders : managed {
        key ID : UUID;
        orderNumber : String(20);
        orderDate : DateTime;
        totalAmount : Decimal(15,2);
        status : String(20);
        customer : Association to Customers;
        items : Composition of many OrderItems on items.order = $self;
    }
    
    entity OrderItems {
        key ID : UUID;
        order : Association to Orders;
        product : String(100);
        quantity : Integer;
        unitPrice : Decimal(15,2);
        totalPrice : Decimal(15,2);
    }
    
    @ORD.entityType: 'com.example:entityType:CustomerAnalytics:v1'
    entity CustomerAnalytics {
        key customer : Association to Customers;
        avgOrderValue : Decimal(15,2);
        orderCount : Integer;
        lastOrderDate : Date;
        churnRisk : Decimal(3,2);
        satisfactionScore : Decimal(3,2);
    }
}

// Example: Order Intelligence - Derived data product that consumes external data
@ORD.dataProduct: {
    title: 'Order Intelligence Data Product',
    description: 'Enhanced order analytics combining internal orders with external market data',
    type: 'derived',
    visibility: 'internal',
    responsible: 'analytics-team@company.com'
}
@ORD.lifecycle: {
    releaseStatus: 'beta',
    lifecycleStatus: 'provisioning'
}
@ORD.inputPorts: [{
    ordId: 'com.example:integrationDependency:MarketData:v1',
    description: 'External market data for order enrichment'
}, {
    ordId: 'com.example:integrationDependency:SupplyChain:v1',
    description: 'Supply chain data for delivery predictions'
}]
@ORD.entityTypes: [
    'com.example:entityType:EnrichedOrder:v1',
    'com.example:entityType:MarketTrend:v1'
]
@ORD.governance: {
    systemInstanceAware: false
}
@ORD.consumes: ['MarketDataService', 'SupplyChainService']
service OrderIntelligenceService {
    
    @ORD.externalSource: 'MarketDataService'
    entity MarketTrends {
        key ID : UUID;
        trendDate : Date;
        category : String(50);
        demandIndex : Decimal(5,2);
        priceIndex : Decimal(5,2);
    }
    
    entity EnrichedOrders as projection on CustomerService.Orders {
        *,
        marketTrend : Association to MarketTrends,
        deliveryPrediction : Date,
        demandScore : Decimal(3,2)
    }
}

// Example: Deprecated data product with successor
@ORD.dataProduct: {
    title: 'Legacy Customer Data',
    description: 'Deprecated - use Customer 360 Data Product instead',
    type: 'primary',
    visibility: 'public'
}
@ORD.deprecated: '2024-06-30T23:59:59Z'
@ORD.successor: 'com.example:dataProduct:CustomerService:v2'
@ORD.lifecycle: {
    releaseStatus: 'deprecated',
    deprecationDate: '2024-06-30T23:59:59Z',
    sunsetDate: '2024-12-31T23:59:59Z',
    successors: ['com.example:dataProduct:CustomerService:v2']
}
service LegacyCustomerService {
    entity Customers {
        key ID : Integer;
        name : String(100);
        email : String(255);
    }
}