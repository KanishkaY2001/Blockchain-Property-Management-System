# COMP6452 Blockchain-Boogaloo
A centralized, blockchain real-estate management solution that aims to provide an interactable framework between property owners and buyers.

### Install the following:
- npm
- nodejs
- ganache
- truffle

### Node Modules
- web3
- ethers
- mysql2
- truffle-hdwallet-provider

### develop Commands:
1) truffle compile
2) truffle develop
3) truffle migrate

### Testing commands:
- truffle test

### Ropsten commands:
1) truffle deploy --network ropsten
2) truffle exec ropsten/CertifyUsers.js --network ropsten
3) truffle exec ropsten/StartAuction.js --network ropsten
4) truffle exec ropsten/PlaceBids.js --network ropsten
5) truffle exec ropsten/UserClaim.js --network ropsten

### Notes:
- unit tests in test folder
- offchain logic in offchain folder
- smart contracts in contracts folder
- contract migrations in migrations folder
- essential imports in node_modules folder
- ropsten testnet scripts in ropsten folder
