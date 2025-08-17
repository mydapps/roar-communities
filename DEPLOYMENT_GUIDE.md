# Community Token System Deployment Guide

## 🎯 **Overview**

This guide walks you through deploying the dapps.co Community Token System on Base Sepolia testnet. The system consists of 4 main contracts that work together to create a decentralized community token economy with bonding curves.

## 📋 **Prerequisites**

### **Required Software**
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (already installed)
- [Node.js](https://nodejs.org/) v18+ (for frontend integration)
- [Git](https://git-scm.com/) (for version control)

### **Required Accounts & Keys**
- **Deployer wallet** with Base Sepolia ETH for gas fees
- **Owner wallet** (preferably multisig) for contract administration
- **Platform Treasury** wallet for collecting platform fees
- **BaseScan API key** for contract verification

### **Required Information**
- Uniswap V4 Pool Manager address on Base Sepolia
- WETH address on Base Sepolia: `0x4200000000000000000000000000000000000006`

## 🔧 **Setup Instructions**

### **Step 1: Environment Configuration**
1. Copy the environment template:
   ```bash
   cp env.template .env
   ```

2. Fill in your configuration in `.env`:
   ```bash
   # Required addresses
   DEPLOYER_ADDRESS=0x...        # Your deployer wallet
   OWNER_ADDRESS=0x...           # Contract owner (dapps.co multisig)
   PLATFORM_TREASURY=0x...       # Platform fee recipient
   
   # Required keys
   PRIVATE_KEY=your_private_key_here
   BASESCAN_API_KEY=your_api_key_here
   
   # Network configuration
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   UNISWAP_V4_POOL_MANAGER=0x...  # Update when V4 is deployed
   ```

### **Step 2: Get Base Sepolia ETH**
1. Visit [Base Sepolia Faucet](https://faucet.quicknode.com/base/sepolia)
2. Request ETH for your deployer address
3. Verify balance: `cast balance $DEPLOYER_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL`

### **Step 3: Compile Contracts**
```bash
forge build
```

### **Step 4: Run Tests (Optional)**
```bash
forge test
```

## 🚀 **Deployment Process**

### **Phase 1: Contract Deployment**

1. **Deploy all contracts:**
   ```bash
   forge script script/DeployContracts.s.sol --rpc-url base_sepolia --broadcast --verify
   ```

2. **Verify deployment:**
   ```bash
   # Check if contracts are deployed
   cast code $REWARDS_MANAGER_ADDRESS --rpc-url base_sepolia
   cast code $BONDING_HOOK_ADDRESS --rpc-url base_sepolia
   cast code $FACTORY_ADDRESS --rpc-url base_sepolia
   ```

### **Phase 2: Contract Verification**

If auto-verification fails during deployment:

```bash
# Verify RewardsManager
forge verify-contract $REWARDS_MANAGER_ADDRESS \
  src/RewardsManager.sol:RewardsManager \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" $OWNER_ADDRESS)

# Verify BondingCurveHook
forge verify-contract $BONDING_HOOK_ADDRESS \
  src/BondingCurveHook.sol:BondingCurveHook \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" $UNISWAP_V4_POOL_MANAGER $PLATFORM_TREASURY $OWNER_ADDRESS)

# Verify CommunityTokenFactory
forge verify-contract $FACTORY_ADDRESS \
  src/CommunityTokenFactory.sol:CommunityTokenFactory \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address,address,address,address)" $OWNER_ADDRESS $UNISWAP_V4_POOL_MANAGER $BONDING_HOOK_ADDRESS $REWARDS_MANAGER_ADDRESS $WETH_BASE_SEPOLIA $PLATFORM_TREASURY)
```

### **Phase 3: Initial Configuration**

1. **Authorize community creators:**
   ```bash
   # Authorize dapps.co backend service
   cast send $FACTORY_ADDRESS "setCreatorAuthorization(address,bool)" \
     $DAPPS_BACKEND_ADDRESS true \
     --rpc-url base_sepolia \
     --private-key $PRIVATE_KEY
   ```

2. **Configure rewards distribution:**
   ```bash
   # Authorize backend for reward distribution
   cast send $REWARDS_MANAGER_ADDRESS "setDistributorAuthorization(address,bool)" \
     $DAPPS_BACKEND_ADDRESS true \
     --rpc-url base_sepolia \
     --private-key $PRIVATE_KEY
   ```

## 🧪 **Testing the Deployment**

### **Create a Test Community**

1. **Prepare test data:**
   ```bash
   export TEST_NAME="Test Community"
   export TEST_SYMBOL="TEST"
   export TEST_ID="test-community-1"
   export TEST_ADMIN="0x..." # Test admin wallet
   export TEST_CREATOR="0x..." # Test creator wallet
   export TEST_PRICE="5000000000000" # 0.000005 ETH
   ```

2. **Create community:**
   ```bash
   cast send $FACTORY_ADDRESS "createCommunity((string,string,string,address,address,uint256))" \
     "($TEST_NAME,$TEST_SYMBOL,$TEST_ID,$TEST_ADMIN,$TEST_CREATOR,$TEST_PRICE)" \
     --rpc-url base_sepolia \
     --private-key $PRIVATE_KEY
   ```

3. **Verify community creation:**
   ```bash
   # Get community info
   cast call $FACTORY_ADDRESS "getCommunityInfo(string)" $TEST_ID --rpc-url base_sepolia
   
   # Get token address
   cast call $FACTORY_ADDRESS "communities(string)" $TEST_ID --rpc-url base_sepolia
   ```

### **Test Token Functionality**

1. **Check token details:**
   ```bash
   # Get token info
   cast call $TOKEN_ADDRESS "getTokenInfo()" --rpc-url base_sepolia
   
   # Check total supply
   cast call $TOKEN_ADDRESS "totalSupply()" --rpc-url base_sepolia
   
   # Verify rewards manager has all tokens
   cast call $TOKEN_ADDRESS "balanceOf(address)" $REWARDS_MANAGER_ADDRESS --rpc-url base_sepolia
   ```

## 📊 **Post-Deployment Checklist**

### **✅ Contract Verification**
- [ ] All contracts deployed successfully
- [ ] All contracts verified on BaseScan
- [ ] Contract addresses saved in documentation
- [ ] Environment variables updated with deployed addresses

### **✅ Configuration Verification**
- [ ] Factory has correct hook and rewards manager addresses
- [ ] Hook has correct factory address
- [ ] Rewards manager has correct permissions
- [ ] Fee configuration is correct (0.25%, 0.25%, 0.5%)

### **✅ Access Control**
- [ ] Contract ownership transferred to multisig
- [ ] Community creator permissions configured
- [ ] Rewards distributor permissions configured
- [ ] Emergency functions accessible to owner

### **✅ Integration Testing**
- [ ] Test community created successfully
- [ ] Token deployment works correctly
- [ ] All tokens transferred to rewards manager
- [ ] Bonding curve pricing functional
- [ ] Fee distribution working

## 🔗 **Integration with dapps.co**

### **Backend Integration**

1. **Update environment variables:**
   ```bash
   # In dapps.co backend
   COMMUNITY_TOKEN_FACTORY=0x...
   REWARDS_MANAGER=0x...
   BONDING_CURVE_HOOK=0x...
   BASE_SEPOLIA_RPC=https://sepolia.base.org
   ```

2. **Add contract ABIs:**
   ```bash
   # Copy ABIs to backend
   cp out/CommunityTokenFactory.sol/CommunityTokenFactory.json ../api.dapps.co/contracts/
   cp out/RewardsManager.sol/RewardsManager.json ../api.dapps.co/contracts/
   cp out/BondingCurveHook.sol/BondingCurveHook.json ../api.dapps.co/contracts/
   ```

### **Frontend Integration**

1. **Update contract addresses:**
   ```javascript
   // In frontend config
   export const CONTRACTS = {
     FACTORY: '0x....',
     REWARDS_MANAGER: '0x....',
     BONDING_HOOK: '0x....'
   };
   ```

2. **Add Uniswap V4 trading interface:**
   ```javascript
   // Trading interface for community tokens
   import { useUniswapV4 } from './hooks/useUniswapV4';
   ```

## 🚨 **Emergency Procedures**

### **Pause Contracts**
```bash
# Pause factory
cast send $FACTORY_ADDRESS "pause()" --rpc-url base_sepolia --private-key $OWNER_PRIVATE_KEY

# Pause rewards manager
cast send $REWARDS_MANAGER_ADDRESS "pause()" --rpc-url base_sepolia --private-key $OWNER_PRIVATE_KEY

# Pause bonding hook
cast send $BONDING_HOOK_ADDRESS "pause()" --rpc-url base_sepolia --private-key $OWNER_PRIVATE_KEY
```

### **Emergency Withdrawal**
```bash
# Withdraw ETH from factory
cast send $FACTORY_ADDRESS "emergencyWithdraw(address,uint256)" \
  "0x0000000000000000000000000000000000000000" $AMOUNT \
  --rpc-url base_sepolia --private-key $OWNER_PRIVATE_KEY

# Withdraw tokens from rewards manager
cast send $REWARDS_MANAGER_ADDRESS "emergencyWithdraw(address,uint256)" \
  $TOKEN_ADDRESS $AMOUNT \
  --rpc-url base_sepolia --private-key $OWNER_PRIVATE_KEY
```

## 📈 **Monitoring & Maintenance**

### **Key Metrics to Monitor**
- Gas usage for community creation
- Fee distribution accuracy
- Token price calculations
- Rewards distribution efficiency
- Contract interaction success rates

### **Regular Maintenance**
- Monitor contract balances
- Verify fee distributions
- Check bonding curve calculations
- Review access control settings
- Update documentation as needed

## 🔄 **Upgrading to Mainnet**

When ready to deploy to Base Mainnet:

1. **Update environment:**
   ```bash
   BASE_MAINNET_RPC_URL=https://mainnet.base.org
   UNISWAP_V4_POOL_MANAGER=0x... # Mainnet address
   ```

2. **Follow same deployment process**
3. **Increase gas limits for mainnet**
4. **Use multisig for all admin operations**

## 📞 **Support**

For deployment issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review contract verification on BaseScan
- Contact the development team
- Join the developer Discord

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"Invalid hook permissions"**
   - Verify hook address is correct
   - Check hook permissions are properly set

2. **"Insufficient ETH for gas"**
   - Get more Base Sepolia ETH from faucet
   - Increase gas limit in script

3. **"Contract verification failed"**
   - Check constructor arguments are correct
   - Verify compiler version matches (0.8.26)
   - Ensure all imports are available

4. **"Unauthorized creator"**
   - Verify creator authorization was set
   - Check transaction was confirmed

### **Debug Commands**

```bash
# Check contract code
cast code $CONTRACT_ADDRESS --rpc-url base_sepolia

# Check transaction receipt
cast receipt $TX_HASH --rpc-url base_sepolia

# Check contract owner
cast call $CONTRACT_ADDRESS "owner()" --rpc-url base_sepolia

# Check authorization
cast call $FACTORY_ADDRESS "authorizedCreators(address)" $ADDRESS --rpc-url base_sepolia
```

---

🎉 **Congratulations!** You have successfully deployed the dapps.co Community Token System on Base Sepolia! 