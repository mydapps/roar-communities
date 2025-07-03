const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const axios = require('axios');

// For blockchain wallet functionality
let ethers;
try {
    ethers = require('ethers');
} catch (e) {
    console.log('⚠️  ethers.js not found. Installing...');
    require('child_process').execSync('npm install ethers', { stdio: 'inherit' });
    ethers = require('ethers');
}

// Load environment variables
require('dotenv').config();

class FilCDNTester {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.config = {
            privateKey: process.env.FILCDN_PRIVATE_KEY,
            baseURL: 'https://api.filcdn.com', // Placeholder URL - needs to be updated
            wallet: null,
            testFiles: []
        };
        
        this.setupWallet();
    }

    setupWallet() {
        if (!this.config.privateKey) {
            console.log('❌ FILCDN_PRIVATE_KEY not found in environment variables');
            console.log('Please add FILCDN_PRIVATE_KEY to your .env file');
            process.exit(1);
        }

        try {
            // Create wallet from private key
            this.config.wallet = new ethers.Wallet(this.config.privateKey);
            console.log('✅ Wallet created successfully');
            console.log(`📍 Wallet Address: ${this.config.wallet.address}`);
            console.log(`🔑 Public Key: ${this.config.wallet.publicKey}`);
        } catch (error) {
            console.log('❌ Error creating wallet from private key:', error.message);
            process.exit(1);
        }
    }

    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    async createTestFile() {
        const testContent = `
🌟 FilCDN Test File
===================
Created: ${new Date().toISOString()}
Wallet: ${this.config.wallet.address}
Random ID: ${crypto.randomBytes(16).toString('hex')}

This is a test file for filCDN upload/download functionality.
The file contains some sample data to verify the upload/download process works correctly.

Test Data:
- Text content: Lorem ipsum dolor sit amet
- Numbers: ${Math.random() * 1000}
- JSON: ${JSON.stringify({test: true, timestamp: Date.now()})}
        `.trim();

        const fileName = `filcdn-test-${Date.now()}.txt`;
        const filePath = path.join(__dirname, fileName);
        
        fs.writeFileSync(filePath, testContent);
        console.log(`📄 Created test file: ${fileName} (${testContent.length} bytes)`);
        
        return {
            name: fileName,
            path: filePath,
            size: testContent.length,
            content: testContent
        };
    }

    async estimateUploadCost(fileSize) {
        // Placeholder for cost estimation
        // This would need to be implemented based on actual filCDN API
        console.log('\n💰 Estimating Upload Cost...');
        
        try {
            // Example API call (needs to be updated with actual filCDN endpoints)
            const response = await axios.post(`${this.config.baseURL}/estimate-cost`, {
                fileSize: fileSize,
                wallet: this.config.wallet.address
            }, {
                headers: {
                    'Authorization': `Bearer ${this.signMessage('estimate-cost')}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.log('⚠️  Cost estimation API not available yet. Using mock data.');
            
            // Mock cost calculation (replace with real implementation)
            const costPerMB = 0.001; // Example: 0.001 ETH per MB
            const fileSizeMB = fileSize / (1024 * 1024);
            const estimatedCost = fileSizeMB * costPerMB;
            
            return {
                fileSize: fileSize,
                fileSizeMB: fileSizeMB.toFixed(4),
                costPerMB: costPerMB,
                estimatedCost: estimatedCost.toFixed(6),
                currency: 'ETH',
                gasEstimate: '0.002',
                totalCost: (estimatedCost + 0.002).toFixed(6)
            };
        }
    }

    signMessage(message) {
        // Create a signature for API authentication
        const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(message));
        return this.config.wallet.signMessage(messageHash);
    }

    async uploadFile(file) {
        console.log(`\n📤 Uploading file: ${file.name}`);
        console.log(`File size: ${file.size} bytes`);

        try {
            // Get cost estimate first
            const costEstimate = await this.estimateUploadCost(file.size);
            console.log('\n💰 Cost Estimate:');
            console.log(`   File Size: ${costEstimate.fileSizeMB} MB`);
            console.log(`   Storage Cost: ${costEstimate.estimatedCost} ${costEstimate.currency}`);
            console.log(`   Gas Estimate: ${costEstimate.gasEstimate} ${costEstimate.currency}`);
            console.log(`   Total Cost: ${costEstimate.totalCost} ${costEstimate.currency}`);

            const proceed = await this.question('\n🤔 Proceed with upload? (y/N): ');
            if (proceed.toLowerCase() !== 'y') {
                console.log('❌ Upload cancelled by user');
                return null;
            }

            // Read file content
            const fileContent = fs.readFileSync(file.path);
            const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
            
            console.log(`🔍 File hash: ${fileHash}`);
            console.log('📡 Uploading to filCDN...');

            // Create form data for file upload
            const FormData = require('form-data');
            const form = new FormData();
            form.append('file', fs.createReadStream(file.path));
            form.append('wallet', this.config.wallet.address);
            form.append('signature', await this.signMessage(`upload-${fileHash}`));
            form.append('timestamp', Date.now().toString());

            // Example upload request (needs to be updated with actual filCDN API)
            const uploadResponse = await axios.post(`${this.config.baseURL}/upload`, form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${await this.signMessage('upload-request')}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            const uploadResult = {
                success: true,
                fileId: uploadResponse.data.fileId || `mock-${crypto.randomBytes(16).toString('hex')}`,
                fileHash: fileHash,
                uploadUrl: uploadResponse.data.uploadUrl || `https://filcdn.com/file/${fileHash}`,
                size: file.size,
                timestamp: new Date().toISOString(),
                transactionHash: uploadResponse.data.transactionHash || `0x${crypto.randomBytes(32).toString('hex')}`,
                cost: costEstimate
            };

            console.log('✅ Upload successful!');
            console.log(`   File ID: ${uploadResult.fileId}`);
            console.log(`   File URL: ${uploadResult.uploadUrl}`);
            console.log(`   Transaction: ${uploadResult.transactionHash}`);

            return uploadResult;

        } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.log('⚠️  filCDN API not available. Creating mock upload result for testing...');
                
                // Mock successful upload for testing
                const fileContent = fs.readFileSync(file.path);
                const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
                
                return {
                    success: true,
                    fileId: `mock-${crypto.randomBytes(16).toString('hex')}`,
                    fileHash: fileHash,
                    uploadUrl: `https://filcdn.com/file/${fileHash}`,
                    size: file.size,
                    timestamp: new Date().toISOString(),
                    transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
                    cost: await this.estimateUploadCost(file.size),
                    mock: true
                };
            }
            
            console.log('❌ Upload failed:', error.message);
            throw error;
        }
    }

    async downloadFile(uploadResult, downloadPath) {
        console.log(`\n📥 Downloading file from filCDN...`);
        console.log(`   File ID: ${uploadResult.fileId}`);
        console.log(`   URL: ${uploadResult.uploadUrl}`);

        try {
            let downloadUrl = uploadResult.uploadUrl;
            
            // If using file ID, construct download URL
            if (!downloadUrl && uploadResult.fileId) {
                downloadUrl = `${this.config.baseURL}/download/${uploadResult.fileId}`;
            }

            console.log('📡 Fetching file...');

            const response = await axios.get(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${await this.signMessage(`download-${uploadResult.fileId}`)}`,
                    'X-Wallet-Address': this.config.wallet.address
                },
                responseType: 'arraybuffer'
            });

            fs.writeFileSync(downloadPath, response.data);
            
            // Verify file integrity
            const downloadedHash = crypto.createHash('sha256').update(response.data).digest('hex');
            const originalHash = uploadResult.fileHash;
            
            console.log('✅ Download successful!');
            console.log(`   Downloaded to: ${downloadPath}`);
            console.log(`   Size: ${response.data.length} bytes`);
            console.log(`   Hash verification: ${downloadedHash === originalHash ? '✅ PASSED' : '❌ FAILED'}`);
            
            if (downloadedHash !== originalHash) {
                console.log(`   Original:  ${originalHash}`);
                console.log(`   Downloaded: ${downloadedHash}`);
            }

            return {
                success: true,
                path: downloadPath,
                size: response.data.length,
                hashMatch: downloadedHash === originalHash,
                downloadedHash: downloadedHash,
                originalHash: originalHash
            };

        } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.log('⚠️  filCDN API not available. Creating mock download for testing...');
                
                // For mock mode, just copy the original file
                if (uploadResult.mock && fs.existsSync(uploadResult.originalPath || './filcdn-test-*.txt')) {
                    const testFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('filcdn-test-'));
                    if (testFiles.length > 0) {
                        const sourceFile = path.join(__dirname, testFiles[testFiles.length - 1]);
                        fs.copyFileSync(sourceFile, downloadPath);
                        
                        const downloadedContent = fs.readFileSync(downloadPath);
                        const downloadedHash = crypto.createHash('sha256').update(downloadedContent).digest('hex');
                        
                        console.log('✅ Mock download successful!');
                        console.log(`   Downloaded to: ${downloadPath}`);
                        console.log(`   Size: ${downloadedContent.length} bytes`);
                        
                        return {
                            success: true,
                            path: downloadPath,
                            size: downloadedContent.length,
                            hashMatch: true,
                            downloadedHash: downloadedHash,
                            originalHash: uploadResult.fileHash,
                            mock: true
                        };
                    }
                }
            }
            
            console.log('❌ Download failed:', error.message);
            throw error;
        }
    }

    async checkBalance() {
        console.log('\n💳 Checking wallet balance...');
        
        try {
            // This would need to be implemented with actual blockchain provider
            // For now, just show the wallet address and note about funding
            console.log(`📍 Wallet Address: ${this.config.wallet.address}`);
            console.log('💡 Please ensure this wallet has sufficient tokens for filCDN operations');
            console.log('💡 You can transfer test tokens to this address for testing');
            
            // Mock balance check
            console.log('⚠️  Balance check API not implemented yet');
            console.log('🔗 Transfer tokens to your wallet address above to test uploads');
            
        } catch (error) {
            console.log('❌ Error checking balance:', error.message);
        }
    }

    async runInteractiveTest() {
        console.log('\n🚀 FilCDN Interactive Tester');
        console.log('================================');
        
        // Show wallet info
        await this.checkBalance();

        while (true) {
            console.log('\n📋 Available Actions:');
            console.log('1. 📤 Create test file and upload');
            console.log('2. 📥 Download previously uploaded file');
            console.log('3. 💰 Estimate upload cost');
            console.log('4. 💳 Check wallet balance');
            console.log('5. 🔍 Show wallet info');
            console.log('6. 🚪 Exit');

            const choice = await this.question('\n👉 Choose an action (1-6): ');

            try {
                switch (choice) {
                    case '1':
                        console.log('\n📤 Creating and uploading test file...');
                        const testFile = await this.createTestFile();
                        const uploadResult = await this.uploadFile(testFile);
                        
                        if (uploadResult) {
                            this.config.testFiles.push({
                                ...uploadResult,
                                originalPath: testFile.path
                            });
                            console.log('\n✅ Upload completed successfully!');
                            
                            // Ask if user wants to download immediately
                            const downloadNow = await this.question('📥 Download the file now to verify? (y/N): ');
                            if (downloadNow.toLowerCase() === 'y') {
                                const downloadPath = path.join(__dirname, `downloaded-${Date.now()}.txt`);
                                await this.downloadFile(uploadResult, downloadPath);
                            }
                        }
                        break;

                    case '2':
                        if (this.config.testFiles.length === 0) {
                            console.log('❌ No uploaded files available. Upload a file first.');
                            break;
                        }
                        
                        console.log('\n📥 Available files for download:');
                        this.config.testFiles.forEach((file, index) => {
                            console.log(`${index + 1}. ${file.fileId} (${file.size} bytes) - ${file.timestamp}`);
                        });
                        
                        const fileIndex = await this.question('👉 Choose file number: ');
                        const selectedFile = this.config.testFiles[parseInt(fileIndex) - 1];
                        
                        if (selectedFile) {
                            const downloadPath = path.join(__dirname, `downloaded-${Date.now()}.txt`);
                            await this.downloadFile(selectedFile, downloadPath);
                        } else {
                            console.log('❌ Invalid file selection');
                        }
                        break;

                    case '3':
                        const fileSizeInput = await this.question('📏 Enter file size in bytes: ');
                        const fileSize = parseInt(fileSizeInput);
                        
                        if (isNaN(fileSize) || fileSize <= 0) {
                            console.log('❌ Invalid file size');
                            break;
                        }
                        
                        const costEstimate = await this.estimateUploadCost(fileSize);
                        console.log('\n💰 Cost Estimate:');
                        console.log(`   File Size: ${costEstimate.fileSizeMB} MB`);
                        console.log(`   Storage Cost: ${costEstimate.estimatedCost} ${costEstimate.currency}`);
                        console.log(`   Gas Estimate: ${costEstimate.gasEstimate} ${costEstimate.currency}`);
                        console.log(`   Total Cost: ${costEstimate.totalCost} ${costEstimate.currency}`);
                        break;

                    case '4':
                        await this.checkBalance();
                        break;

                    case '5':
                        console.log('\n🔑 Wallet Information:');
                        console.log(`   Address: ${this.config.wallet.address}`);
                        console.log(`   Public Key: ${this.config.wallet.publicKey}`);
                        console.log(`   Private Key: ${this.config.privateKey.substring(0, 10)}...`);
                        break;

                    case '6':
                        console.log('\n👋 Exiting FilCDN tester...');
                        this.cleanup();
                        return;

                    default:
                        console.log('❌ Invalid choice. Please select 1-6.');
                }
            } catch (error) {
                console.log('❌ Error:', error.message);
                console.log('🔄 Continuing with the test...');
            }
        }
    }

    cleanup() {
        // Clean up test files
        try {
            const testFiles = fs.readdirSync(__dirname).filter(f => 
                f.startsWith('filcdn-test-') || f.startsWith('downloaded-')
            );
            
            if (testFiles.length > 0) {
                console.log('\n🧹 Cleaning up test files...');
                testFiles.forEach(file => {
                    const filePath = path.join(__dirname, file);
                    fs.unlinkSync(filePath);
                    console.log(`   Deleted: ${file}`);
                });
            }
        } catch (error) {
            console.log('⚠️  Error cleaning up files:', error.message);
        }
        
        this.rl.close();
        
        console.log('\n✅ FilCDN test completed!');
        console.log('📝 Summary:');
        console.log(`   Wallet Address: ${this.config.wallet.address}`);
        console.log(`   Files Tested: ${this.config.testFiles.length}`);
        console.log('📋 Please update the API endpoints in this script with actual filCDN documentation');
    }
}

// Main execution
async function main() {
    console.log('🎯 FilCDN Test Script Starting...');
    console.log('====================================');
    
    // Check for required dependencies
    const requiredPackages = ['ethers', 'axios', 'form-data'];
    const missingPackages = [];
    
    for (const pkg of requiredPackages) {
        try {
            require(pkg);
        } catch (e) {
            missingPackages.push(pkg);
        }
    }
    
    if (missingPackages.length > 0) {
        console.log('📦 Installing missing packages:', missingPackages.join(', '));
        const { execSync } = require('child_process');
        execSync(`npm install ${missingPackages.join(' ')}`, { stdio: 'inherit' });
    }

    try {
        const tester = new FilCDNTester();
        await tester.runInteractiveTest();
    } catch (error) {
        console.log('❌ Fatal error:', error.message);
        console.log('🔧 Please check your environment configuration and try again');
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = FilCDNTester; 