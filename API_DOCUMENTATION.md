# Community Token System API Documentation

## 🎯 **Overview**

This documentation covers the **permissionless community token system** for dapps.co. Anyone can create community tokens with a fixed bonding curve and fee structure.

## 📋 **Contract Addresses**

```javascript
// Base Sepolia Testnet
export const CONTRACTS = {
  FACTORY: '0x...', // CommunityTokenFactory
  REWARDS_MANAGER: '0x...', // RewardsManager  
  BONDING_HOOK: '0x...', // BondingCurveHook
  POOL_MANAGER: '0x...', // Uniswap V4 PoolManager
  WETH: '0x4200000000000000000000000000000000000006'
};
```

## 💰 **Fee Structure (Fixed)**

| Fee Type | Percentage | Recipient | Purpose |
|----------|------------|-----------|---------|
| **Community Admin** | 0.25% | Community Admin Wallet | Community management |
| **Protocol Fee** | 0.25% | Platform Treasury | Protocol development |
| **Community Rewards** | 0.50% | Rewards Manager | Content creator rewards |
| **Total Trading Fees** | **1.00%** | *Split as above* | *All trading volume* |

## 🏭 **CommunityTokenFactory Contract**

### **Create Community (Permissionless)**

**Anyone can call this function - no permissions required!**

```solidity
function createCommunity(CommunityConfig calldata config) 
  external returns (address token, PoolId poolId)
```

**Parameters:**
```typescript
interface CommunityConfig {
  name: string;                    // Token name (e.g., "Developers Token")
  symbol: string;                  // Token symbol (e.g., "DEV")
  communityId: string;             // Unique identifier (e.g., "developers")
  communityAdminWallet: string;    // Wallet that receives 0.25% trading fees
}
```

**Key Features:**
- ✅ **Permissionless**: Anyone can create tokens
- ✅ **Fixed Base Price**: All tokens start at 0.000005 ETH
- ✅ **Fixed Supply**: All tokens get 1 billion tokens
- ✅ **All Tokens to Rewards**: 100% of tokens go to rewards pool
- ✅ **Cubic Bonding Curve**: Price = BasePrice / (TokensInPool ÷ 1B)³

**JavaScript Example:**
```javascript
import { ethers } from 'ethers';

const factory = new ethers.Contract(CONTRACTS.FACTORY, factoryABI, signer);

const config = {
  name: "Developers Community Token",
  symbol: "DEV", 
  communityId: "developers",
  communityAdminWallet: "0x..." // This wallet gets 0.25% of all trading fees
};

// Anyone can call this - no authorization needed!
const tx = await factory.createCommunity(config);
const receipt = await tx.wait();

console.log("Community created! Token address:", tokenAddress);
```

**cURL Example:**
```bash
# Anyone can create a community token
cast send $FACTORY_ADDRESS "createCommunity((string,string,string,address))" \
  "(\"My Community\",\"MYC\",\"my-community\",\"0xYourAdminWallet\")" \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY
```

### **Get Fixed Base Price**

All tokens use the same starting price:

```solidity
function getFixedBasePrice() external view returns (uint256 basePrice)
```

**JavaScript Example:**
```javascript
const basePrice = await factory.getFixedBasePrice();
console.log(`All tokens start at: ${ethers.formatEther(basePrice)} ETH`);
// Output: "All tokens start at: 0.000005 ETH"
```

### **Get Current Token Price**

```solidity
function getCurrentTokenPrice(string calldata communityId) 
  external view returns (uint256 price)
```

**JavaScript Example:**
```javascript
const currentPrice = await factory.getCurrentTokenPrice("developers");
const priceETH = ethers.formatEther(currentPrice);
console.log(`Current price: ${priceETH} ETH per token`);
```

### **Get Community Information**

```solidity
function getCommunityInfo(string calldata communityId) 
  external view returns (CommunityInfo memory)
```

**JavaScript Example:**
```javascript
const info = await factory.getCommunityInfo("developers");
console.log({
  token: info.token,
  poolId: info.poolId,
  communityAdminWallet: info.communityAdminWallet,
  creator: info.creator, // Who created it (no special privileges)
  createdAt: new Date(Number(info.createdAt) * 1000),
  isActive: info.isActive
});
```

## 🎁 **RewardsManager Contract**

### **Distribute Rewards**

Only authorized distributors (like dapps.co backend) can distribute rewards:

```solidity
function distributeRewards(
  string calldata communityId,
  address[] calldata recipients,
  uint256[] calldata tokenAmounts,
  uint256[] calldata ethAmounts,
  string[] calldata contentIds,
  string[] calldata reasons
) external
```

**JavaScript Example:**
```javascript
const rewardsManager = new ethers.Contract(CONTRACTS.REWARDS_MANAGER, rewardsABI, signer);

// Distribute rewards to content creators
await rewardsManager.distributeRewards(
  "developers",
  ["0x...", "0x..."], // Recipients
  [ethers.parseEther("100"), ethers.parseEther("50")], // Token amounts
  [ethers.parseEther("0.01"), ethers.parseEther("0.005")], // ETH from trading fees
  ["post_123", "comment_456"], // Content IDs
  ["Quality post", "Helpful comment"] // Reasons
);
```

## 📈 **BondingCurveHook Contract**

### **Get Fee Configuration**

```solidity
function getFeeConfiguration() external view returns (
  uint256 communityAdminFee,  // 25 = 0.25%
  uint256 platformFee,        // 25 = 0.25%  
  uint256 rewardsFee          // 50 = 0.5%
)
```

**JavaScript Example:**
```javascript
const bondingHook = new ethers.Contract(CONTRACTS.BONDING_HOOK, hookABI, provider);

const [adminFee, platformFee, rewardsFee] = await bondingHook.getFeeConfiguration();
console.log({
  communityAdminFee: `${adminFee / 100}%`, // "0.25%"
  platformFee: `${platformFee / 100}%`,    // "0.25%"
  rewardsFee: `${rewardsFee / 100}%`       // "0.5%"
});
```

### **Calculate Bonding Curve Price**

```solidity
function calculateBondingCurvePrice(
  uint256 tokensInPool,
  uint256 basePrice,
  uint256 totalSupply
) public pure returns (uint256 price)
```

**JavaScript Example:**
```javascript
const tokensInPool = ethers.parseEther("800000000"); // 800M tokens left
const basePrice = ethers.parseEther("0.000005");     // 0.000005 ETH
const totalSupply = ethers.parseEther("1000000000");  // 1B total

const currentPrice = await bondingHook.calculateBondingCurvePrice(
  tokensInPool,
  basePrice,
  totalSupply
);

console.log(`Price with 800M tokens left: ${ethers.formatEther(currentPrice)} ETH`);
```

## 🪙 **CommunityToken Contract (Standard ERC20)**

### **Token Information**

```solidity
function getTokenInfo() external view returns (
  address factory,
  string memory communityId,
  uint256 totalSupply,
  uint256 createdAt
)
```

**JavaScript Example:**
```javascript
const token = new ethers.Contract(tokenAddress, tokenABI, provider);

const [factory, communityId, totalSupply, createdAt] = await token.getTokenInfo();
console.log({
  factory,
  communityId,
  totalSupply: ethers.formatEther(totalSupply), // "1000000000.0" (1B tokens)
  createdAt: new Date(Number(createdAt) * 1000)
});
```

## 🔄 **Trading Integration**

### **Price Calculation Before Trading**

```javascript
class CommunityTokenPricing {
  constructor(factoryAddress, provider) {
    this.factory = new ethers.Contract(factoryAddress, factoryABI, provider);
  }
  
  async getCurrentPrice(communityId) {
    return await this.factory.getCurrentTokenPrice(communityId);
  }
  
  async estimateTokensForETH(communityId, ethAmount) {
    const currentPrice = await this.getCurrentPrice(communityId);
    // Simplified calculation - actual implementation needs integral calculus
    const approximateTokens = ethAmount / currentPrice;
    
    return {
      tokenAmount: approximateTokens,
      pricePerToken: currentPrice,
      totalCost: ethAmount
    };
  }
}
```

### **Community Creation Flow**

```javascript
// Complete community creation example
async function createCommunity(name, symbol, communityId, adminWallet) {
  try {
    // 1. Create the community token
    const tx = await factory.createCommunity({
      name,
      symbol,
      communityId,
      communityAdminWallet: adminWallet
    });
    
    const receipt = await tx.wait();
    console.log("✅ Community created successfully!");
    
    // 2. Get the created token address
    const communityInfo = await factory.getCommunityInfo(communityId);
    const tokenAddress = communityInfo.token;
    
    // 3. Verify all tokens went to rewards manager
    const token = new ethers.Contract(tokenAddress, tokenABI, provider);
    const rewardsBalance = await token.balanceOf(CONTRACTS.REWARDS_MANAGER);
    const totalSupply = await token.totalSupply();
    
    console.log("✅ Token verification:");
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} tokens`);
    console.log(`   Rewards Pool: ${ethers.formatEther(rewardsBalance)} tokens`);
    console.log(`   Creator Balance: 0 tokens (as expected)`);
    
    // 4. Get initial price
    const currentPrice = await factory.getCurrentTokenPrice(communityId);
    console.log(`   Starting Price: ${ethers.formatEther(currentPrice)} ETH`);
    
    return {
      tokenAddress,
      poolId: communityInfo.poolId,
      startingPrice: currentPrice
    };
    
  } catch (error) {
    console.error("❌ Community creation failed:", error.message);
    throw error;
  }
}
```

## 🔧 **Administrative Functions**

### **Update Platform Treasury (Protocol Only)**

```solidity
function updatePlatformTreasury(address newTreasury) external onlyOwner
```

**JavaScript Example:**
```javascript
// Only protocol owner can update platform treasury
await factory.updatePlatformTreasury("0xNewTreasuryAddress");
await bondingHook.updatePlatformTreasury("0xNewTreasuryAddress");
```

### **Authorization Management**

```javascript
// Authorize reward distributors (backend services)
await rewardsManager.setDistributorAuthorization(backendAddress, true);

// Emergency pause (protocol owner only)
await factory.pause();
await rewardsManager.pause();
await bondingHook.pause();
```

## 📊 **Events and Monitoring**

### **Key Events to Monitor**

```javascript
// Community creation (permissionless)
factory.on("CommunityCreated", (communityId, token, poolId, creator, adminWallet) => {
  console.log(`🎉 New community created: ${communityId} by ${creator}`);
});

// Reward distribution
rewardsManager.on("RewardDistributed", (recipient, communityToken, tokenAmount, ethAmount, contentId, reason) => {
  console.log(`💰 Reward: ${ethers.formatEther(tokenAmount)} tokens to ${recipient}`);
});

// Fee distribution from trading
bondingHook.on("FeesDistributed", (communityToken, adminWallet, adminFee, platformFee, rewardsFee) => {
  console.log(`📊 Fees distributed for ${communityToken}:`);
  console.log(`   Admin: ${ethers.formatEther(adminFee)} ETH`);
  console.log(`   Platform: ${ethers.formatEther(platformFee)} ETH`);
  console.log(`   Rewards: ${ethers.formatEther(rewardsFee)} ETH`);
});
```

## 🔗 **Express.js Backend Integration**

```javascript
const express = require('express');
const { ethers } = require('ethers');

const app = express();
const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC);

// Anyone can create a community - no authorization needed
app.post('/api/communities', async (req, res) => {
  try {
    const { name, symbol, communityId, adminWallet, creatorPrivateKey } = req.body;
    
    // Use creator's wallet (they pay gas)
    const creatorWallet = new ethers.Wallet(creatorPrivateKey, provider);
    const factory = new ethers.Contract(CONTRACTS.FACTORY, factoryABI, creatorWallet);
    
    const tx = await factory.createCommunity({
      name,
      symbol,
      communityId,
      communityAdminWallet: adminWallet
    });
    
    const receipt = await tx.wait();
    const communityInfo = await factory.getCommunityInfo(communityId);
    
    res.json({ 
      success: true, 
      txHash: receipt.hash,
      tokenAddress: communityInfo.token,
      startingPrice: await factory.getFixedBasePrice()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get community price
app.get('/api/communities/:id/price', async (req, res) => {
  try {
    const factory = new ethers.Contract(CONTRACTS.FACTORY, factoryABI, provider);
    const price = await factory.getCurrentTokenPrice(req.params.id);
    res.json({ 
      price: ethers.formatEther(price),
      priceWei: price.toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🎯 **Key Differences from Previous Version**

### **✅ What Changed**

1. **Permissionless Creation**: Anyone can create community tokens (no authorization required)
2. **Fixed Base Price**: All tokens start at exactly 0.000005 ETH (no custom pricing)
3. **Simplified Parameters**: Only need to specify name, symbol, communityId, and adminWallet
4. **Clear Fee Structure**: Fixed percentages with clear documentation
5. **Protocol-Controlled**: Platform treasury is updatable by protocol (not hardcoded)

### **✅ What Stayed the Same**

1. **Bonding Curve Formula**: Price = BasePrice / (TokensInPool ÷ 1B)³
2. **1 Billion Token Supply**: Every community gets exactly 1B tokens
3. **100% Rewards Allocation**: All tokens go to rewards pool
4. **Fee Distribution**: Real-time distribution during trades
5. **Uniswap V4 Integration**: Pools and trading through Uniswap V4

## 🚀 **Quick Start Example**

```bash
# 1. Deploy contracts (protocol owner)
forge script script/DeployContracts.s.sol --rpc-url base_sepolia --broadcast

# 2. Create a community token (anyone can do this!)
cast send $FACTORY_ADDRESS "createCommunity((string,string,string,address))" \
  "(\"My Community\",\"MYC\",\"my-community\",\"0xMyAdminWallet\")" \
  --rpc-url base_sepolia \
  --private-key $YOUR_PRIVATE_KEY

# 3. Check the price
cast call $FACTORY_ADDRESS "getCurrentTokenPrice(string)" "my-community" \
  --rpc-url base_sepolia

# 4. Verify all tokens went to rewards
cast call $TOKEN_ADDRESS "balanceOf(address)" $REWARDS_MANAGER_ADDRESS \
  --rpc-url base_sepolia
```

---

This system creates a truly **permissionless community token economy** where anyone can create tokens, all tokens start at the same price, follow the same bonding curve, and have a transparent fee structure that benefits communities, creators, and the protocol. 