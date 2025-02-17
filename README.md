# Blockchain Todo List & Voting System

A decentralized application (dApp) built with Hardhat, Solidity, Next.js, and TypeScript demonstrating sequential vs concurrent blockchain transactions.

## Project Structure

```
Project1/
├── blockchain/          # Smart contract development
│   ├── contracts/
│   ├── scripts/
│   └── test/
└── client/             # Next.js frontend
    ├── app/
    └── public/
```

## Prerequisites

- Node.js v18+
- Git
- Ganache for local blockchain

## Blockchain Setup (./blockchain)

1. **Install Dependencies**

```bash
cd blockchain
npm install
```

2. **Install Hardhat**

```bash
npm install --save-dev hardhat
npx hardhat init
```

3. **Configure Hardhat**

```javascript
// filepath: /blockchain/hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337
    }
  },
  paths: {
    artifacts: "../client/public",
  }
};
```

4. **Compile and Copy Contracts**

```bash
# Compile contracts
npx hardhat compile

# For Windows: Copy contract artifacts to client
xcopy /y /i "artifacts\contracts\*.json" "..\client\public\"
```

The compilation will:

1. Generate contract artifacts in `./blockchain/artifacts/contracts/`
2. Create JSON files containing:
   - Contract ABI
   - Bytecode
   - Network information

Your contract files will be available at:

- `client/public/TodoList.json`
- `client/public/Voting.json`

To verify the copy:

```bash
# Check if files exist in client/public
dir ..\client\public\*.json
```

> **Note**: If you modify your contracts, remember to recompile and copy the artifacts again.

Open ganache

```env
// filepath: /client/.env.local
NEXT_PUBLIC_TODO_CONTRACT="your_todo_contract_address"
NEXT_PUBLIC_VOTING_CONTRACT="your_voting_contract_address"
NEXT_PUBLIC_RPC_URL="http://127.0.0.1:7545"
```

5. **Deploy to Ganache**

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network ganache
```

After deployment, you'll see contract addresses in the terminal:

```bash
TodoList deployed to: 0x...
Voting deployed to: 0x...
```

Update the contract addresses in your environment file:

```env
// filepath: /client/.env.local
NEXT_PUBLIC_TODO_CONTRACT="your_todo_contract_address"
NEXT_PUBLIC_VOTING_CONTRACT="your_voting_contract_address"
NEXT_PUBLIC_RPC_URL="http://127.0.0.1:7545"
```

Then update your React components to use these environment variables:

```typescript
// filepath: /client/app/page.tsx
const contractAddress = process.env.NEXT_PUBLIC_TODO_CONTRACT;

// filepath: /client/app/dashboard/page.tsx
const contractAddress = process.env.NEXT_PUBLIC_VOTING_CONTRACT;
```

> **Note**: Make sure to restart your Next.js development server after updating environment variables.

To verify deployment:

```bash
# Using hardhat console
npx hardhat console --network ganache
> const TodoList = await ethers.getContractFactory("TodoList")
> const todoList = await TodoList.attach("your_todo_contract_address")
> await todoList.taskCount()
```

## Frontend Setup (./client)

1. **Setup Next.js Project**

```bash
cd client
npm install
```

## Running the Project

1. **Start Ganache**
   - Open Ganache
   - Create new workspace
   - Keep RPC Server running on `http://127.0.0.1:7545`

2. **Deploy Smart Contracts**

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network ganache
```

3. **Start Frontend**

```bash
cd client
npm run dev
```

4. **Access the dApp**
   - Open `http://localhost:3000`

## Features

- Todo List Management
- Voting System
- Performance comparison between sequential and concurrent transactions
- Real-time transaction monitoring

## Smart Contracts

### TodoList.sol

- Task creation
- Task toggling
- Batch operations support
- Optimized read operations

### Voting.sol

- Voter registration
- Candidate management
- Voting process control
- Result tallying

## Testing

```bash
# Blockchain Tests
cd blockchain
npx hardhat test

# Frontend Tests
cd client
npm run test
```

## Performance Testing

The dApp includes performance testing features:

- Sequential vs Concurrent transaction comparison
- Batch transaction processing
- Transaction timing measurements
