# Testing Data Products Feature

## Setup

1. Install dependencies:
```bash
cd test-data-products
npm install
```

## Test Methods

### Method 1: Using Environment Variable

```bash
# Enable via environment variable
export ORD_ENABLE_DATA_PRODUCTS=true

# Build ORD document
npx cds build --for ord

# Check the generated ORD document
cat gen/ord/ord-document.json | jq .dataProducts
```

### Method 2: Using CDS Configuration

The `.cdsrc.json` already has the feature enabled:
```json
{
  "ord": {
    "features": {
      "dataProducts": true
    }
  }
}
```

Just run:
```bash
npx cds build --for ord
```

### Method 3: Test with CDS REPL

```bash
# Start CDS REPL
npx cds repl

# In the REPL, run:
const ord = cds.compile.to.ord(cds.model)
console.log(JSON.stringify(ord.dataProducts, null, 2))
```

## Expected Output

With the new flow, ALL services get default data products, then annotations and custom config enhance/override:

```json
{
  "dataProducts": [
    {
      "ordId": "customer.sample:dataProduct:CustomerService:v1",
      "title": "Customer 360 Data Product",  // Overridden by custom.ord.json
      "description": "Enhanced customer data product with additional metadata",  // Overridden
      "version": "1.0.0",
      "type": "primary",
      "visibility": "internal",  // Overridden from 'public' by custom config
      "outputPorts": [
        { "ordId": "customer.sample:apiResource:CustomerService:v1" },
        { "ordId": "customer.sample:eventResource:CustomerService:v1" }
      ],
      "tags": [
        { "key": "domain", "value": "customer" },
        { "key": "quality", "value": "platinum" },  // Overridden by custom
        { "key": "refresh", "value": "real-time" },  // Added by custom config
        { "key": "PII", "value": "true" },  // From entity properties
        { "key": "sensitive", "value": "false" },
        { "key": "financial", "value": "true" }
      ],
      "lineage": {
        "sources": ["s4.customer:BusinessPartner", "crm:Customer"]
      },
      "source": "custom"  // Shows final override source
    },
    {
      "ordId": "customer.sample:dataProduct:SalesService:v2",  // v2 from annotation
      "title": "Sales Analytics Premium",  // Overridden by custom config
      "description": "Premium sales analytics with ML insights",  // Overridden
      "version": "2.0.0",  // From annotation
      "type": "derived",  // From annotation
      "visibility": "private",  // Overridden by custom config
      "outputPorts": [
        { "ordId": "customer.sample:apiResource:SalesService:v1" }
      ],
      "tags": [
        { "key": "aggregated", "value": "true" }
      ],
      "lineage": {
        "sources": ["CustomerService:Orders", "s4.sales:SalesOrders"],
        "transformations": ["aggregation", "enrichment"]
      },
      "source": "custom"
    }
  ]
}
```

## Test Scenarios

### 1. Test Annotation Processing
- Check that service annotations are extracted
- Verify entity lineage and schema are captured
- Confirm property tags are aggregated

### 2. Test Configuration Merge
- Verify custom config overrides annotations (Customer 360 title)
- Check that new data products are added (Inventory)
- Confirm conflict resolution works

### 3. Test Feature Flag
```bash
# Disable feature
unset ORD_ENABLE_DATA_PRODUCTS

# Remove from .cdsrc.json or set to false
# Build should not include dataProducts
npx cds build --for ord
cat gen/ord/ord-document.json | jq .dataProducts  # Should be null
```

### 4. Test Error Handling
Create an invalid annotation:
```cds
@ORD.dataProduct: {
    // Missing required fields
    type: 'invalid-type'
}
service BrokenService {}
```

The build should continue without crashing.

## Debugging

Enable debug logging:
```bash
DEBUG=* npx cds build --for ord 2>&1 | grep -i "dataproduct"
```

## Unit Tests

Run the unit tests:
```bash
cd ..
npm test -- __tests__/dataProducts
```