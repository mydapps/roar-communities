/**
 * 🔍 CDP API Diagnostic Test
 * 
 * This script tests the Coinbase CDP API directly to isolate issues:
 * ✅ API Key authentication
 * ✅ Network connectivity  
 * ✅ SDK configuration
 * ✅ Paymaster endpoint accessibility
 * ✅ Base Network configuration
 */

const { Coinbase, Wallet } = require("@coinbase/coinbase-sdk");
const axios = require('axios');
const readline = require('readline');
const fs = require('fs');

// Enhanced console colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

console.log(`${colors.cyan}${colors.bright}🔍 CDP API Diagnostic Test${colors.reset}`);
console.log(`${colors.blue}📝 Testing CDP API connectivity and paymaster configuration${colors.reset}\n`);

// CDP Configuration
const CDP_API_KEY_NAME = 'd69f14ae-8d53-4013-b11e-2dbcbac8143c';
const CDP_API_PRIVATE_KEY = 'hu5N2IywQfDeQ7LZYjvifolpGVJFl+5UF5BWl1RpuLlgME0XbWuy1GcplJyDsPAockhrjFqxJtXFT8GKxLiJVA==';

// Base Network URLs
const BASE_MAINNET_RPC = 'https://mainnet.base.org';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const CDP_PAYMASTER_URL = `https://api.developer.coinbase.com/rpc/v1/base/${CDP_API_KEY_NAME}`;

/**
 * Test 1: Basic SDK Configuration
 */
async function testSDKConfiguration() {
    console.log(`${colors.blue}\n=== Test 1: SDK Configuration ===`);
    
    try {
        console.log(`${colors.cyan}🔧 Configuring Coinbase SDK...${colors.reset}`);
        console.log(`${colors.white}   API Key Name: ${CDP_API_KEY_NAME}${colors.reset}`);
        console.log(`${colors.white}   Private Key: ${CDP_API_PRIVATE_KEY.substring(0, 20)}...${colors.reset}`);
        
        Coinbase.configure({
            apiKeyName: CDP_API_KEY_NAME,
            privateKey: CDP_API_PRIVATE_KEY,
        });
        
        console.log(`${colors.green}✅ SDK configuration successful${colors.reset}`);
        return true;
    } catch (error) {
        console.log(`${colors.red}❌ SDK configuration failed: ${error.message}${colors.reset}`);
        return false;
    }
}

/**
 * Test 2: Basic Network Connectivity
 */
async function testNetworkConnectivity() {
    console.log(`${colors.blue}\n=== Test 2: Network Connectivity ===`);
    
    const networks = [
        { name: 'Base Mainnet', url: BASE_MAINNET_RPC },
        { name: 'Base Sepolia', url: BASE_SEPOLIA_RPC },
        { name: 'CDP Paymaster', url: CDP_PAYMASTER_URL }
    ];
    
    const results = {};
    
    for (const network of networks) {
        try {
            console.log(`${colors.cyan}🌐 Testing ${network.name}...${colors.reset}`);
            
            if (network.name === 'CDP Paymaster') {
                // Test paymaster endpoint with a simple request
                const response = await axios.post(network.url, {
                    jsonrpc: '2.0',
                    method: 'eth_chainId',
                    params: [],
                    id: 1
                }, {
                    timeout: 5000,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                console.log(`${colors.green}✅ ${network.name} accessible${colors.reset}`);
                console.log(`${colors.white}   Response: ${JSON.stringify(response.data)}${colors.reset}`);
                results[network.name] = { success: true, data: response.data };
            } else {
                // Test regular RPC endpoints
                const response = await axios.post(network.url, {
                    jsonrpc: '2.0',
                    method: 'eth_chainId',
                    params: [],
                    id: 1
                }, { timeout: 5000 });
                
                const chainId = parseInt(response.data.result, 16);
                console.log(`${colors.green}✅ ${network.name} accessible (Chain ID: ${chainId})${colors.reset}`);
                results[network.name] = { success: true, chainId };
            }
        } catch (error) {
            console.log(`${colors.red}❌ ${network.name} failed: ${error.message}${colors.reset}`);
            if (error.response) {
                console.log(`${colors.yellow}   Status: ${error.response.status}${colors.reset}`);
                console.log(`${colors.yellow}   Data: ${JSON.stringify(error.response.data)}${colors.reset}`);
            }
            results[network.name] = { success: false, error: error.message };
        }
    }
    
    return results;
}

/**
 * Test 3: Smart Wallet Creation
 */
async function testWalletCreation() {
    console.log(`${colors.blue}\n=== Test 3: Smart Wallet Creation ===`);
    
    try {
        console.log(`${colors.cyan}🔑 Creating Smart Wallet...${colors.reset}`);
        
        const wallet = await Wallet.create();
        const walletId = wallet.getId();
        const defaultAddress = await wallet.getDefaultAddress();
        const address = defaultAddress.getId();
        
        console.log(`${colors.green}✅ Smart Wallet created successfully${colors.reset}`);
        console.log(`${colors.white}   Wallet ID: ${walletId}${colors.reset}`);
        console.log(`${colors.white}   Address: ${address}${colors.reset}`);
        
        // Test basic balance check
        try {
            const balance = await defaultAddress.getBalance('eth');
            console.log(`${colors.green}✅ Balance check works: ${balance} ETH${colors.reset}`);
        } catch (balanceError) {
            console.log(`${colors.yellow}⚠️  Balance check failed: ${balanceError.message}${colors.reset}`);
        }
        
        return { success: true, wallet, address };
    } catch (error) {
        console.log(`${colors.red}❌ Wallet creation failed: ${error.message}${colors.reset}`);
        return { success: false, error: error.message };
    }
}

/**
 * Test 4: Direct paymaster API test
 */
async function testPaymasterAPI() {
    console.log(`${colors.blue}\n=== Test 4: Direct Paymaster API Test ===`);
    
    try {
        console.log(`${colors.cyan}🎁 Testing paymaster endpoint directly...${colors.reset}`);
        console.log(`${colors.white}   URL: ${CDP_PAYMASTER_URL}${colors.reset}`);
        
        // Test various paymaster methods
        const paymasterTests = [
            {
                name: 'Chain ID Request',
                payload: {
                    jsonrpc: '2.0',
                    method: 'eth_chainId',
                    params: [],
                    id: 1
                }
            },
            {
                name: 'Gas Price Request',
                payload: {
                    jsonrpc: '2.0',
                    method: 'eth_gasPrice',
                    params: [],
                    id: 2
                }
            },
            {
                name: 'Block Number Request',
                payload: {
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: 3
                }
            }
        ];
        
        const results = {};
        
        for (const test of paymasterTests) {
            try {
                console.log(`${colors.cyan}   Testing: ${test.name}...${colors.reset}`);
                
                const response = await axios.post(CDP_PAYMASTER_URL, test.payload, {
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'User-Agent': 'CDP-SDK-Test/1.0'
                    }
                });
                
                console.log(`${colors.green}   ✅ ${test.name} successful${colors.reset}`);
                console.log(`${colors.white}      Response: ${JSON.stringify(response.data)}${colors.reset}`);
                results[test.name] = { success: true, data: response.data };
                
            } catch (testError) {
                console.log(`${colors.red}   ❌ ${test.name} failed: ${testError.message}${colors.reset}`);
                if (testError.response) {
                    console.log(`${colors.yellow}      Status: ${testError.response.status}${colors.reset}`);
                    console.log(`${colors.yellow}      Data: ${JSON.stringify(testError.response.data)}${colors.reset}`);
                }
                results[test.name] = { success: false, error: testError.message };
            }
        }
        
        return results;
    } catch (error) {
        console.log(`${colors.red}❌ Paymaster API test failed: ${error.message}${colors.reset}`);
        return { success: false, error: error.message };
    }
}

/**
 * Test 5: Simple contract interaction (non-gasless)
 */
async function testBasicContractInteraction(wallet) {
    console.log(`${colors.blue}\n=== Test 5: Basic Contract Interaction ===`);
    
    if (!wallet || !wallet.success) {
        console.log(`${colors.red}❌ Skipping - no wallet available${colors.reset}`);
        return { success: false, error: 'No wallet' };
    }
    
    try {
        console.log(`${colors.cyan}📝 Testing basic contract call (no gasless)...${colors.reset}`);
        
        const defaultAddress = await wallet.wallet.getDefaultAddress();
        
        // Simple ERC20 balanceOf call (read-only, should work)
        const simpleConfig = {
            contractAddress: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', // DEGEN
            method: 'balanceOf',
            args: [defaultAddress.getId()],
            abi: [
                {
                    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                }
            ]
        };
        
        console.log(`${colors.white}   Config: ${JSON.stringify(simpleConfig, null, 2)}${colors.reset}`);
        
        // This should be a read-only call, not a transaction
        const result = await defaultAddress.invokeContract(simpleConfig);
        
        console.log(`${colors.green}✅ Basic contract interaction works${colors.reset}`);
        console.log(`${colors.white}   Result: ${JSON.stringify(result, null, 2)}${colors.reset}`);
        
        return { success: true, result };
        
    } catch (error) {
        console.log(`${colors.red}❌ Basic contract interaction failed: ${error.message}${colors.reset}`);
        console.log(`${colors.yellow}   Error details: ${JSON.stringify(error, null, 2)}${colors.reset}`);
        return { success: false, error: error.message };
    }
}

/**
 * Generate diagnostic report
 */
function generateDiagnosticReport(results) {
    console.log(`${colors.blue}\n=== 📊 DIAGNOSTIC REPORT ===`);
    
    const { sdk, network, wallet, paymaster, contract } = results;
    
    // SDK Configuration
    console.log(`${colors.cyan}\n🔧 SDK Configuration:${colors.reset}`);
    console.log(`   Status: ${sdk ? '✅ Working' : '❌ Failed'}`);
    
    // Network Connectivity
    console.log(`${colors.cyan}\n🌐 Network Connectivity:${colors.reset}`);
    Object.entries(network || {}).forEach(([name, result]) => {
        console.log(`   ${name}: ${result.success ? '✅ Working' : '❌ Failed'}`);
        if (!result.success) {
            console.log(`      Error: ${result.error}`);
        }
    });
    
    // Wallet Creation
    console.log(`${colors.cyan}\n🔑 Wallet Creation:${colors.reset}`);
    console.log(`   Status: ${wallet?.success ? '✅ Working' : '❌ Failed'}`);
    if (wallet?.address) {
        console.log(`   Address: ${wallet.address}`);
    }
    
    // Paymaster API
    console.log(`${colors.cyan}\n🎁 Paymaster API:${colors.reset}`);
    if (paymaster && typeof paymaster === 'object') {
        Object.entries(paymaster).forEach(([test, result]) => {
            console.log(`   ${test}: ${result.success ? '✅ Working' : '❌ Failed'}`);
        });
    } else {
        console.log(`   Status: ❌ Not tested or failed`);
    }
    
    // Contract Interaction
    console.log(`${colors.cyan}\n📝 Contract Interaction:${colors.reset}`);
    console.log(`   Status: ${contract?.success ? '✅ Working' : '❌ Failed'}`);
    
    // Overall Assessment
    console.log(`${colors.yellow}\n💡 OVERALL ASSESSMENT:${colors.reset}`);
    
    if (!sdk) {
        console.log(`${colors.red}🚨 CRITICAL: SDK configuration is broken${colors.reset}`);
        console.log(`${colors.white}   → Check API keys and private key format${colors.reset}`);
    } else if (!network?.['CDP Paymaster']?.success) {
        console.log(`${colors.red}🚨 CRITICAL: Cannot reach paymaster endpoint${colors.reset}`);
        console.log(`${colors.white}   → Check API key permissions and network access${colors.reset}`);
        console.log(`${colors.white}   → Verify paymaster URL is correct${colors.reset}`);
    } else if (!wallet?.success) {
        console.log(`${colors.red}🚨 CRITICAL: Cannot create Smart Wallets${colors.reset}`);
        console.log(`${colors.white}   → Check CDP account permissions${colors.reset}`);
    } else if (!contract?.success) {
        console.log(`${colors.yellow}⚠️  CONTRACT INTERACTION ISSUES${colors.reset}`);
        console.log(`${colors.white}   → SDK can connect but can't invoke contracts${colors.reset}`);
        console.log(`${colors.white}   → This explains the MalformedRequestError${colors.reset}`);
    } else {
        console.log(`${colors.green}✅ BASIC FUNCTIONALITY WORKS${colors.reset}`);
        console.log(`${colors.white}   → Issue is specifically with gasless transactions${colors.reset}`);
        console.log(`${colors.white}   → Paymaster configuration needs adjustment${colors.reset}`);
    }
    
    console.log(`${colors.blue}\n📞 NEXT STEPS:${colors.reset}`);
    console.log(`${colors.white}1. 📧 Contact Coinbase CDP support with this diagnostic report${colors.reset}`);
    console.log(`${colors.white}2. 🔍 Reference: MalformedRequestError on invokeContract calls${colors.reset}`);
    console.log(`${colors.white}3. 💰 Mention: $100 CDP credits not enabling gasless functionality${colors.reset}`);
    console.log(`${colors.white}4. 🎯 Include: Both standard ERC20 and custom contracts failing identically${colors.reset}`);
}

/**
 * Main execution
 */
async function main() {
    try {
        const results = {};
        
        // Run all diagnostic tests
        results.sdk = await testSDKConfiguration();
        results.network = await testNetworkConnectivity();
        results.wallet = await testWalletCreation();
        results.paymaster = await testPaymasterAPI();
        results.contract = await testBasicContractInteraction(results.wallet);
        
        // Generate comprehensive report
        generateDiagnosticReport(results);
        
    } catch (error) {
        console.error(`${colors.red}❌ Diagnostic test failed:${colors.reset}`, error.message);
    }
}

// Execute
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testSDKConfiguration,
    testNetworkConnectivity,
    testWalletCreation,
    testPaymasterAPI,
    testBasicContractInteraction
}; 