using {sap.cds.demo as my} from '../db/schema';
using {
    ProcessorService,
    AdminService
} from './incidents-services';

namespace sap.capire.incidents;

annotate ProcessorService with @ORD.dataProduct: {
    title: 'Incident Processing Data Product',
    type: 'primary',
    visibility: 'public',
    category: 'business-object',
    description: 'Real-time incident processing and customer support data'
};

annotate ProcessorService with @ORD.lifecycle: {
    status: 'active',
    deprecationDate: '2026-12-31',
    sunsetDate: '2027-06-30'
};

annotate ProcessorService with @ORD.governance: {
    policyLevel: 'sap:core:v1',
    dataClassification: 'internal'
};

annotate ProcessorService with @ORD.compliance: ['SOX', 'ISO27001'];
annotate ProcessorService with @ORD.industry: ['Technology', 'Services'];
annotate ProcessorService with @ORD.lineOfBusiness: ['Customer Support', 'Operations'];
annotate ProcessorService with @ORD.countries: ['DE', 'US', 'IN'];

annotate ProcessorService with @ORD.labels: {
    dataQuality: ['validated', 'real-time'],
    updateFrequency: ['streaming'],
    sla: ['99.9%']
};

annotate ProcessorService with @ORD.inputPorts: [{
    ordId: 'customer.sample:apiResource:AdminService:v1'
}];

annotate ProcessorService with @ORD.dataProductLinks: [{
    type: 'related',
    ordId: 'customer.sample:dataProduct:AdminService:v1'
}];

@AsyncAPI.Title        : 'SAP Incident Management'
@AsyncAPI.SchemaVersion: '1.0'
extend service ProcessorService {
    event TitleChange : {
        ID    : Integer;
        title : String @title: 'Title';
    }
}

@AsyncAPI.Title                  : 'SAP Incident Management'
@AsyncAPI.SchemaVersion          : '1.0'
service LocalService {
    entity Entertainment as projection on my.Cinema;
    entity Film          as projection on my.Movie;

    event TitleChange : {
        ID    : Integer;
        title : String @title: 'Changed Title';
    }
}

annotate LocalService with @ORD.dataProduct: {
    title: 'Entertainment Venue Data Product',
    type: 'derived',
    visibility: 'public',
    category: 'transactional-data'
};

annotate LocalService with @ORD.industry: ['Entertainment', 'Media'];
annotate LocalService with @ORD.lineOfBusiness: ['Digital Content', 'Streaming'];
annotate LocalService with @ORD.countries: ['US', 'CA', 'UK'];

annotate LocalService with @ORD.tags: ['entertainment', 'venues', 'movies', 'real-time'];

annotate LocalService with @ORD.inputPorts: [{
    ordId: 'external:api:tmdb:v1'
}];

annotate LocalService with @ORD.correlationIds: ['VENUE-2025', 'ENT-MASTER'];

annotate AdminService with @ORD.dataProduct: {
    title: 'Customer Master Data Product',
    type: 'primary',
    visibility: 'internal',
    category: 'master-data',
    description: 'Customer and incident master data management'
};

annotate AdminService with @ORD.personalData: true;
annotate AdminService with @ORD.dataRetention: '7 years';
annotate AdminService with @ORD.compliance: ['GDPR', 'CCPA', 'SOX'];
annotate AdminService with @ORD.dataClassification: 'confidential';

annotate AdminService with @ORD.systemInstanceAware: true;

annotate AdminService with @ORD.documentationLabels: {
    apiVersion: ['v1.0'],
    lastUpdated: ['2025-01-15'],
    dataOwner: ['Customer Success Team']
};

annotate AdminService with @ORD.links: [{
    type: 'documentation',
    url: 'https://docs.example.com/admin-service'
}, {
    type: 'support',
    url: 'https://support.example.com'
}];

annotate sap.capire.incidents.Customers with @ODM.entityName: 'Customers';
annotate sap.capire.incidents.Addresses with @ODM.entityName: 'Addresses';
annotate sap.capire.incidents.Incidents with @ODM.entityName: 'Incidents';

service EntertainmentDataProduct {

    entity Cinema        as projection on my.Cinema;
    entity Film          as projection on my.Movie;
    entity Show          as projection on my.Show;

}

annotate EntertainmentDataProduct with @ORD.dataProduct: {
    title: 'Entertainment Analytics Data Product',
    type: 'derived',
    visibility: 'public',
    category: 'analytical-data',
    description: 'Aggregated entertainment analytics and insights'
};

annotate EntertainmentDataProduct with @ORD.taxonomy: {
    industry: ['Entertainment', 'Analytics'],
    lineOfBusiness: ['Business Intelligence'],
    countries: ['GLOBAL']
};

annotate EntertainmentDataProduct with @ORD.dataProductLinks: [{
    type: 'source',
    ordId: 'customer.sample:dataProduct:LocalService:v1'
}];

annotate EntertainmentDataProduct with @ORD.lifecycle: {
    status: 'beta',
    lastUpdate: '2025-01-15'
};