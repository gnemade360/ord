const cds = require("@sap/cds");
const cds_dk = require("@sap/cds-dk");
const path = require("path");
const { generateDpdFiles, isDpdGenerationEnabled } = require("./dataProducts/dpdGenerator");
const { validateDpd } = require("./dataProducts/dpdBuilder");
const { Logger } = require("./logger");

const DPD_BUILD_DEFAULT_PATH = "gen/dpd";

/**
 * Build plugin for generating DPD (Data Product Descriptor) files
 */
module.exports = class DpdBuildPlugin extends cds_dk.build.Plugin {
    static taskDefaults = { src: cds.env.folders.srv };
    
    init() {
        this.task.dest = path.join(cds.root, DPD_BUILD_DEFAULT_PATH);
    }
    
    /**
     * Main build function for DPD generation
     */
    async build() {
        Logger.info("Starting DPD generation...");
        
        // Check if DPD generation is enabled
        if (!isDpdGenerationEnabled()) {
            Logger.info("DPD generation is disabled. Set DPD_GENERATION_ENABLED=true to enable.");
            return [];
        }
        
        try {
            // Load the model
            const model = await this.model();
            
            // Initialize app configuration
            const appConfig = this.initializeAppConfig(model);
            
            // Generate DPD files
            const dpdFiles = generateDpdFiles(model, appConfig);
            
            if (dpdFiles.length === 0) {
                Logger.info("No data product annotations found. No DPD files generated.");
                return [];
            }
            
            // Write DPD files
            const promises = [];
            for (const dpdFile of dpdFiles) {
                // Validate DPD before writing
                if (validateDpd(dpdFile.content)) {
                    Logger.info(`Writing DPD file: ${dpdFile.filename}`);
                    promises.push(
                        this.write(dpdFile.content)
                            .to(dpdFile.filename)
                            .then(() => {
                                Logger.info(`Successfully wrote DPD: ${dpdFile.filename}`);
                            })
                            .catch(err => {
                                Logger.error(`Failed to write DPD ${dpdFile.filename}: ${err.message}`);
                            })
                    );
                } else {
                    Logger.error(`Skipping invalid DPD: ${dpdFile.filename}`);
                }
            }
            
            await Promise.all(promises);
            
            Logger.info(`DPD generation completed. Generated ${dpdFiles.length} files.`);
            return promises;
            
        } catch (error) {
            Logger.error(`DPD generation failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Initialize application configuration
     * @param {object} csn - Compiled Service Network
     * @returns {object} - Application configuration
     */
    initializeAppConfig(csn) {
        const packageJson = this.loadPackageJson();
        const packageName = packageJson.name;
        const appName = this.formatAppName(packageName);
        const ordNamespace = this.getNamespace(packageName);
        
        return {
            env: cds.env["dpd"] || cds.env["ord"],
            appName,
            ordNamespace,
            packageName
        };
    }
    
    /**
     * Load package.json
     * @returns {object} - Package.json content
     */
    loadPackageJson() {
        const packageJsonPath = path.join(cds.root, "package.json");
        if (!cds.utils.exists(packageJsonPath)) {
            throw new Error("package.json not found in the project root directory");
        }
        return require(packageJsonPath);
    }
    
    /**
     * Format application name
     * @param {string} packageName - Package name from package.json
     * @returns {string} - Formatted app name
     */
    formatAppName(packageName) {
        return packageName.replace(/^[@]/, "").replace(/[@/]/g, "-");
    }
    
    /**
     * Get namespace for DPD
     * @param {string} packageName - Package name
     * @returns {string} - Namespace
     */
    getNamespace(packageName) {
        const vendorNamespace = "customer";
        const envNamespace = cds.env["dpd"]?.namespace || cds.env["ord"]?.namespace;
        return envNamespace || `${vendorNamespace}.${packageName.replace(/[^a-zA-Z0-9]/g, "")}`;
    }
};