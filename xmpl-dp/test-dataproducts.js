// Load the ORD library from the parent directory
const path = require('path');
const cds = require('@sap/cds');
const ord = require('../lib/ord.js');

async function generateAndValidate() {
    // Enable data products feature
    // This can be set via environment variable or CDS configuration
    process.env.ORD_ENABLE_DATA_PRODUCTS = "true";
    
    // Change to the correct directory
    const originalCwd = process.cwd();
    const xmplDpDir = path.resolve(__dirname);
    process.chdir(xmplDpDir);
    
    // Set CDS root for proper context
    cds.root = xmplDpDir;
    
    console.log(`Working directory: ${process.cwd()}`);
    console.log(`CDS root: ${cds.root}`);
    console.log('Loading model...');
    const csn = await cds.load(path.join(cds.root, 'srv'));
    
    console.log('Generating ORD with Data Products...');
    // Generate ORD document from the loaded CSN
    const ordDocument = await ord(csn);
    
    console.log('\nData Products Generated:');
    console.log(`Total: ${ordDocument.dataProducts?.length || 0}`);
    
    if (ordDocument.dataProducts) {
        ordDocument.dataProducts.forEach(dp => {
            console.log(`\n- ${dp.title}`);
            console.log(`  ID: ${dp.ordId}`);
            console.log(`  Type: ${dp.type}`);
            console.log(`  Visibility: ${dp.visibility}`);
            console.log(`  Tags: ${dp.tags?.join(', ') || 'none'}`);
        });
    }
    
    // Save to file
    require('fs').writeFileSync(
        'gen/ord/ord-document.json',
        JSON.stringify(ordDocument, null, 2)
    );
    
    console.log('\n✅ ORD document generated successfully!');
    
    // Restore original working directory
    process.chdir(originalCwd);
}

generateAndValidate().catch(console.error);