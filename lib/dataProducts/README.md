# Data Products Module Structure

## File Organization

### `index.js` - Main Entry Point
- `processDataProducts()` - Main async orchestration function
- `isDataProductsEnabled()` - Feature flag check

### `processors/` - Chain of Responsibility Pattern
- `processor.js` - Chain orchestration
  - `DataProductProcessorChain` - Manages the processing chain
  - `createDataProductProcessor()` - Factory function
- `BaseProcessor.js` - Abstract base class for all processors
- `DefaultsProcessor.js` - Creates default data products for all services
  - `initDataProductObj()` - Initializes a new data product object
- `AnnotationsProcessor.js` - Applies CDS annotations
  - `applyServiceAnnotations()` - Processes @ORD.dataProduct
  - `enrichWithEntityAnnotations()` - Processes entity annotations
- `CustomOrdProcessor.js` - Merges custom configuration
  - `mergeConfiguration()` - Merges only matching IDs

### `config.js` - Configuration Management
- `loadCustomConfiguration()` - Loads custom ORD.json file
- `validateConfiguration()` - Validates configuration structure

### `builder.js` - ORD Document Building (Transforms to ORD Format)
- `buildDataProducts()` - Builds array of data products for ORD document
- `buildDataProduct()` - Transforms config object to ORD structure (does NOT create new objects)
- `generateOutputPorts()` - Creates output port references
- `validateDataProduct()` - Validates final data product

### `utils.js` - Shared Utilities
- `generateDataProductId()` - Creates ORD ID for data product
- `validateType()` - Validates and defaults data product type
- `validateVisibility()` - Validates and defaults visibility
- `processTags()` - Normalizes tag formats
- `mergeUniqueTags()` - Merges tags without duplicates

### `constants.js` - Centralized Constants
- `ANNOTATIONS` - All ORD annotation names
- `DEFAULTS` - Default values for data products
- `VALID_TYPES` - Valid data product types
- `VALID_VISIBILITIES` - Valid visibility options
- `SOURCE_TYPES` - Source tracking constants

## Processing Flow (Chain of Responsibility)

1. **Initialize Chain** (`processors/processor.js`)
   - Create processor chain: Defaults → Annotations → Custom
   - Pass context with CSN, namespace, and config path

2. **DefaultsProcessor**
   - Creates default data product for EVERY service
   - Uses `initDataProductObj()` for consistent initialization
   - Sets source as "default"

3. **AnnotationsProcessor**
   - Applies `@ORD.dataProduct` annotations to existing products
   - Extracts entity annotations (`@ORD.schema`, `@ORD.lineage`)
   - Collects property tags (`@ORD.tag`)
   - Updates source to "annotated" if modified

4. **CustomOrdProcessor**
   - Loads custom ORD.json configuration
   - Merges only matching data product IDs
   - Tracks and logs conflicts
   - Updates source to "custom" if modified

5. **Build ORD Structure** (`builder.js`)
   - Transform internal objects to ORD format
   - Add output ports
   - Validate final structure
   - Handle optional fields elegantly

## Key Design Decisions

- **Chain of Responsibility Pattern** - Modular, extensible processing pipeline
- **Every service gets a default** - Predictable behavior
- **Processors create/modify**, `builder.js` only transforms - Clear separation
- **Annotations enhance, don't create** - Separation of concerns
- **Custom config only overrides existing** - Safety first
- **Single Responsibility** - Each processor does one thing well
- **Async/Await throughout** - Modern, clean error handling
- **Optional fields elegantly handled** - Mapping pattern avoids repetition

## Benefits of New Architecture

1. **Extensibility** - Easy to add new processors
2. **Testability** - Each processor tested in isolation
3. **Maintainability** - Clear separation of concerns
4. **Flexibility** - Easy to reorder or skip processors
5. **Debugging** - Clear flow through named processors