#!/usr/bin/env node

const cds = require('@sap/cds');
const path = require('path');

async function testDataProducts() {
    console.log('🧪 Testing ORD Data Products Feature\n');
    
    // Set environment variable
    process.env.ORD_ENABLE_DATA_PRODUCTS = 'true';
    
    try {
        // Load the model
        console.log('1️⃣ Loading CDS model...');
        const csn = await cds.load('srv/*.cds');
        console.log('✅ Model loaded successfully\n');
        
        // Compile to ORD
        console.log('2️⃣ Compiling to ORD document...');
        const ord = cds.compile.to.ord(csn);
        console.log('✅ ORD document generated\n');
        
        // Check data products
        console.log('3️⃣ Data Products Found:');
        if (ord.dataProducts && ord.dataProducts.length > 0) {
            ord.dataProducts.forEach((dp, index) => {
                console.log(`\n📦 Data Product ${index + 1}:`);
                console.log(`   ID: ${dp.ordId}`);
                console.log(`   Title: ${dp.title}`);
                console.log(`   Type: ${dp.type}`);
                console.log(`   Visibility: ${dp.visibility}`);
                console.log(`   Output Ports: ${dp.outputPorts?.length || 0}`);
                console.log(`   Tags: ${dp.tags?.map(t => `${t.key}=${t.value}`).join(', ') || 'none'}`);
                if (dp.lineage) {
                    console.log(`   Lineage Sources: ${dp.lineage.sources?.join(', ') || 'none'}`);
                }
            });
        } else {
            console.log('❌ No data products found!');
        }
        
        // Test feature flag
        console.log('\n\n4️⃣ Testing Feature Flag:');
        delete process.env.ORD_ENABLE_DATA_PRODUCTS;
        const ordDisabled = cds.compile.to.ord(csn);
        console.log(`   With flag disabled: ${ordDisabled.dataProducts ? '❌ Still has data products' : '✅ No data products'}`);
        
        // Save to file
        console.log('\n\n5️⃣ Saving ORD document to ord-output.json');
        const fs = require('fs');
        fs.writeFileSync('ord-output.json', JSON.stringify(ord, null, 2));
        console.log('✅ Done! Check ord-output.json for full output');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    testDataProducts();
}

module.exports = { testDataProducts };