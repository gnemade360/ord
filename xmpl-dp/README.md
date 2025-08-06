# xmpl-dp - Data Products Example

This example demonstrates comprehensive usage of ORD Data Product annotations.

## Features Demonstrated

1. **Service-Level Annotations**
   - @ORD.dataProduct - Core configuration
   - @ORD.lifecycle - Lifecycle management
   - @ORD.governance - Governance metadata
   - @ORD.compliance - Compliance tracking

2. **Entity-Level Annotations**
   - @ORD.schema - Schema versioning
   - @ORD.lineage - Data lineage
   - @ORD.tag - Property tagging

3. **Integration Features**
   - Input/Output ports
   - Data product links
   - External source tracking

## Running the Example

```bash
npm install
npm run generate-ord
```

## Expected Output

The generated ORD document will contain a populated `dataProducts` array with 4 data products:
- ProcessorService (Operational)
- AdminService (Master Data)
- LocalService (Regional)
- EntertainmentDataProduct (Analytics)