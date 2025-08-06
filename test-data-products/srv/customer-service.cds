@ORD.dataProduct: {
    title: 'Customer Master Data',
    description: 'Complete customer information including profiles and transactions',
    version: '1.0.0',
    type: 'primary',
    visibility: 'public',
    tags: [
        { key: 'domain', value: 'customer' },
        { key: 'quality', value: 'gold' }
    ]
}
service CustomerService {
    
    @ORD.lineage: {
        sources: ['s4.customer:BusinessPartner', 'crm:Customer']
    }
    @ORD.schema: {
        format: 'application/json'
    }
    entity Customers {
        key ID : UUID;
        
        @ORD.tag: { key: 'PII', value: 'true' }
        name : String(100);
        
        @ORD.tag: { key: 'PII', value: 'true' }
        email : String(100);
        
        @ORD.tag: { key: 'sensitive', value: 'false' }
        country : String(2);
        
        orders : Association to many Orders on orders.customer = $self;
    }
    
    entity Orders {
        key ID : UUID;
        orderNumber : String(10);
        
        @ORD.tag: { key: 'financial', value: 'true' }
        totalAmount : Decimal(15,2);
        
        customer : Association to Customers;
    }
    
    // This will create an event output port
    event CustomerCreated {
        customerID : UUID;
        name : String;
    }
}