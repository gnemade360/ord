@ORD.dataProduct: {
    title: 'Sales Analytics',
    description: 'Sales data for analytics and reporting',
    version: '2.0.0',
    type: 'derived',
    visibility: 'internal'
}
service SalesService {
    
    @ORD.lineage: {
        sources: ['CustomerService:Orders', 's4.sales:SalesOrders'],
        transformations: ['aggregation', 'enrichment']
    }
    entity SalesAnalytics {
        key period : String(7); // YYYY-MM
        
        @ORD.tag: { key: 'aggregated', value: 'true' }
        totalRevenue : Decimal(15,2);
        
        @ORD.tag: { key: 'aggregated', value: 'true' }
        orderCount : Integer;
        
        customerCount : Integer;
    }
}