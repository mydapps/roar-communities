# Community Tokens Architecture

## 🎯 **System Overview**

The Community Tokens system transforms dapps.co communities from share-based to token-based economics using Uniswap V4's advanced hook architecture. Each community gets its own ERC20 token with a bonding curve that incentivizes early participation and sustainable growth.

## 🏗️ **Contract Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    DAPPS.CO ECOSYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │  1. FACTORY     │    │  2. BONDING CURVE HOOK       │   │
│  │  CONTRACT       │────│  (Manages ALL communities)   │   │
│  │  - Deploy tokens│    │  - Cubic bonding curve       │   │
│  │  - Initialize   │    │  - Real-time fee distribution│   │
│  │  - Access control│   │  - Anti-rug protection       │   │
│  └─────────────────┘    │  - State management          │   │
│           │              └──────────────────────────────┘   │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │  3. COMMUNITY   │    │  4. REWARDS MANAGER          │   │
│  │  TOKEN (ERC20)  │    │  - Holds all tokens          │   │
│  │  - 1B supply    │────│  - Distribution logic        │   │
│  │  - No creator   │    │  - Staking mechanisms        │   │
│  │  - Standard impl│    │  - Reward calculations       │   │
│  └─────────────────┘    └──────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    UNISWAP V4 ECOSYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  5. POOL MANAGER (Uniswap's Singleton)                 ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       ││
│  │  │ Community A │ │ Community B │ │ Community C │  ...  ││
│  │  │    Pool     │ │    Pool     │ │    Pool     │       ││
│  │  │(Token/ETH)  │ │(Token/ETH)  │ │(Token/ETH)  │       ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 📝 **Contract Details**

### **1. CommunityTokenFactory.sol**
**Purpose**: Deploy and initialize community tokens with Uniswap V4 pools
**Key Features**:
- Deploy standard ERC20 tokens (1B supply)
- Initialize Uniswap V4 pools with bonding curve hook
- Set up fee recipient addresses
- Transfer all tokens to rewards manager
- Access control for authorized community creation

### **2. BondingCurveHook.sol**
**Purpose**: Handle all bonding curve logic and fee distribution for ALL communities
**Key Features**:
- Cubic bonding curve: `Price = BasePrice / (TokensInPool ÷ 1B)³`
- Real-time fee distribution (0.25% admin, 0.25% platform, 0.5% rewards)
- State management for multiple communities
- Anti-rug protection mechanisms
- Gas-optimized fee transfers

### **3. CommunityToken.sol**
**Purpose**: Standard ERC20 with no special privileges for creator
**Key Features**:
- 1 billion token supply
- Standard ERC20 implementation
- No admin functions for creator
- All tokens immediately transferred to rewards manager

### **4. RewardsManager.sol**
**Purpose**: Hold and distribute community tokens as rewards
**Key Features**:
- Receives all community tokens upon creation
- Handles reward distribution to content creators
- Staking mechanisms for community members
- Integration with dapps.co backend for reward calculations

### **5. Uniswap V4 PoolManager**
**Purpose**: Existing Uniswap singleton that holds all liquidity pools
**Integration**:
- We initialize pools in this existing contract
- Our hook is called on every swap
- All liquidity lives in the singleton architecture

## 🔄 **Core Flows**

### **Community Creation Flow**
```
1. Admin calls factory.createCommunity(name, symbol, communityConfig)
2. Factory deploys new CommunityToken(1B supply)
3. Factory calls PoolManager.initialize() with our hook
4. All 1B tokens transferred to RewardsManager
5. Initial ETH liquidity added to establish base price
6. Hook configured with fee recipient addresses
7. Community is live and tradeable
```

### **Trading Flow**
```
1. User calls PoolManager.swap() for community token
2. PoolManager calls our BondingCurveHook.beforeSwap()
3. Hook calculates price using cubic bonding curve
4. Hook distributes fees in real-time:
   - 0.25% to community admin (ETH)
   - 0.25% to platform treasury (ETH)
   - 0.5% to community rewards pool (ETH)
5. Swap executes with calculated price
6. User receives tokens/ETH based on bonding curve
```

### **Rewards Distribution Flow**
```
1. Backend identifies reward-worthy content
2. Backend calls RewardsManager.distributeRewards()
3. Community tokens transferred from pool to creators
4. ETH rewards from trading fees also distributed
5. Staking rewards calculated and distributed
```

## 🎛️ **Configuration Management**

### **Fee Recipients**
Each community has three configured addresses:
- **Community Admin**: Receives 0.25% of all trading volume in ETH
- **Platform Treasury**: Receives 0.25% (hardcoded to dapps.co wallet)
- **Community Rewards**: Receives 0.5% for distribution to creators

### **Bonding Curve Parameters**
- **Base Price**: $0.000005 (initial market cap = $5k)
- **Total Supply**: 1 billion tokens
- **Curve Type**: Cubic (`/³`) for strong early-adopter incentives
- **Initial Liquidity**: Provided during community creation

## 🔐 **Security Considerations**

### **Access Control**
- Only authorized addresses can create communities
- Community creators have no special token rights
- All admin functions controlled by dapps.co wallet
- Hook contract has pausable emergency functions

### **Anti-Rug Protection**
- All tokens go to rewards pool (no creator allocation)
- Trading fees create immediate value for community
- Bonding curve prevents liquidity extraction
- Time locks on administrative functions

### **Upgrade Mechanisms**
- Factory contract upgradeable via proxy pattern
- Hook contract upgradeable for bug fixes
- Community tokens are immutable standard ERC20s
- Rewards manager upgradeable for feature additions

## 📊 **Economic Model**

### **Token Distribution**
- **100% Community Rewards**: All 1B tokens go to rewards pool
- **0% Creator Allocation**: No tokens reserved for community creator
- **0% Platform Reserve**: Platform earns through trading fees only

### **Revenue Streams**
- **Community Admin**: 0.25% of trading volume
- **Platform**: 0.25% of trading volume + potential token appreciation
- **Community Members**: Token rewards + staking yields + price appreciation

### **Incentive Alignment**
- Early buyers get better prices due to bonding curve
- Community growth increases token value for all holders
- Trading activity generates rewards for active members
- Platform growth benefits all communities through network effects

## 🚀 **Deployment Strategy**

### **Phase 1: Base Sepolia Testnet**
1. Deploy and test all contracts
2. Validate bonding curve mathematics
3. Test fee distribution mechanisms
4. Verify gas costs and optimizations

### **Phase 2: Base Mainnet**
1. Deploy factory and hook contracts
2. Initialize first test community
3. Monitor performance and gas costs
4. Gradually roll out to more communities

### **Phase 3: Full Migration**
1. Migrate existing communities from shares to tokens
2. Launch community creation interface
3. Enable public community creation
4. Monitor and optimize based on usage

## 🔧 **Technical Specifications**

### **Supported Networks**
- **Primary**: Base Network (lower fees, fast finality)
- **Testnet**: Base Sepolia (for development)
- **Future**: Other EVM-compatible chains

### **Gas Optimization**
- Batch fee distributions where possible
- Use assembly for mathematical calculations
- Minimize storage reads/writes in hook
- Optimize for common trading patterns

### **Integration Points**
- **dapps.co Backend**: For reward distribution and community management
- **Frontend**: For trading interface and community creation
- **Mobile Apps**: For mobile trading and portfolio management
- **Analytics**: For tracking community growth and token performance 