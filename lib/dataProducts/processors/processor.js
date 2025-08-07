const DefaultsProcessor = require("./DefaultsProcessor");
const AnnotationsProcessor = require("./AnnotationsProcessor");
const LifecycleProcessor = require("./LifecycleProcessor");
const TaxonomyProcessor = require("./TaxonomyProcessor");
const EntityTypesProcessor = require("./EntityTypesProcessor");
const InputPortsProcessor = require("./InputPortsProcessor");
const DataProductLinksProcessor = require("./DataProductLinksProcessor");
const GovernanceProcessor = require("./GovernanceProcessor");
const CustomOrdProcessor = require("./CustomOrdProcessor");
const { Logger } = require("../../logger");

class DataProductProcessorChain {
    constructor() {
        this.chain = this.buildChain();
    }
    
    buildChain() {
        const defaultsProcessor = new DefaultsProcessor();
        const annotationsProcessor = new AnnotationsProcessor();
        const lifecycleProcessor = new LifecycleProcessor();
        const taxonomyProcessor = new TaxonomyProcessor();
        const entityTypesProcessor = new EntityTypesProcessor();
        const inputPortsProcessor = new InputPortsProcessor();
        const dataProductLinksProcessor = new DataProductLinksProcessor();
        const governanceProcessor = new GovernanceProcessor();
        const customOrdProcessor = new CustomOrdProcessor();
        
        defaultsProcessor
            .setNext(annotationsProcessor)
            .setNext(lifecycleProcessor)
            .setNext(taxonomyProcessor)
            .setNext(entityTypesProcessor)
            .setNext(inputPortsProcessor)
            .setNext(dataProductLinksProcessor)
            .setNext(governanceProcessor)
            .setNext(customOrdProcessor);
        
        return defaultsProcessor;
    }
    
    process(context) {
        Logger.info("DataProductProcessorChain: Starting processing chain");
        
        try {
            const result = this.chain.handle([], context);
            
            Logger.info(`DataProductProcessorChain: Completed processing ${result.length} data products`);
            return result;
        } catch (error) {
            Logger.error(`DataProductProcessorChain: Processing failed - ${error.message}`);
            throw error;
        }
    }
}

function createDataProductProcessor() {
    return new DataProductProcessorChain();
}

module.exports = {
    DataProductProcessorChain,
    createDataProductProcessor
};