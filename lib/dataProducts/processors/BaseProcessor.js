const { Logger } = require("../../logger");

class BaseProcessor {
    constructor() {
        this.next = null;
    }
    
    setNext(processor) {
        this.next = processor;
        return processor;
    }
    
    process(dataProducts, context) {
        throw new Error("Process method must be implemented by subclass");
    }
    
    handle(dataProducts, context) {
        try {
            const result = this.process(dataProducts, context);
            
            if (this.next) {
                return this.next.handle(result, context);
            }
            
            return result;
        } catch (error) {
            Logger.error(`Error in ${this.constructor.name}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = BaseProcessor;