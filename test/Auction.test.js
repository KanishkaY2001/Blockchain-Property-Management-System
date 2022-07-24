//==============================================================================//
//                  Unit Test - Showcase Auction Functionality                  //
//==============================================================================//

//=======================================//
//     Initialize Contract Templates     //
//=======================================//

const PropertyOracle = artifacts.require("PropertyOracle");
const PropertyToken = artifacts.require("PropertyToken");

//=======================================//
//         Import Offchain Logic         //
//=======================================//

const certif = require("../offchain/LandCertification.js");


/**
 * Unit test whih ensures that the overall auction process is conduced as expected
 * The test uses 3 users (Commonwealth, Seller, Buyer/Bidder)
 * An interaction between the users, smart contracts and off-chain code is tested
 * This test supports the Ropsten testnet commands, and must pass to ensure reliability
 */
contract('PropertyToken', (accs) => {
    // Starting asynchronous unit test logic
    it("auction and bidding functionality", async () => {

        // 0) Before anything, setup some familiar names to work with
        const seller = accs[1]; // Property owner and seller
        const buyer = accs[2]; // Bidder or property buyer

        // 1) Process begins by establishing smart contract existance
        const propertyOracle = await PropertyOracle.deployed();
        const propertyToken = await PropertyToken.deployed();

        // 2) The system requires users to be certified to participate
        var userOne = [["John Smith","16/08/1976","John_Smith@gmail.com","0484132656","23631261"],
            ["2","4","5","31 Spooner Street","1"]]; // Creating fake data to represent property info
        await certif.ApplicationForm(
            seller, // Represents the seller's public address
            userOne, // Fabricated user details
            await certif.CreateSignature(seller, accs[0]), // User's public key signature
            accs[0], // Commonwealth's public address (testing purpose)
            artifacts // Local contract templates (builds)
        );
        
        // Information to represent the buyer's details. This personal info is stored in the database
        var userTwo = [["Jane Doe","16/08/1979","Jane_Doe@gmail.com","0414794634","23851368"],];
        await certif.ApplicationForm(
            buyer, // Represents the buyer's public address
            userTwo, // Fabricated user details
            await certif.CreateSignature(buyer, accs[0]),  // User's public key signature
            accs[0],  // Commonwealth's public address (testing purpose)
            artifacts // Local contract templates (builds)
        );

        // 3) Ensure that userOne owns the property NFT, and both users are certified
        var pId = 1; // First property is always 1, then 2,3,..,n

        // Get the current owner of the property NFT
        var oldOwner = await propertyToken.ownerOf(1, {from: seller});

        // Get the injected public key signatures and the injected property URI info
        var acc1Sig = await propertyOracle.GetPublicSign(seller, {from: seller});
        var acc1Prop = await propertyOracle.GetPropertyInfo(pId, {from: seller});
        var acc2Sig = await propertyOracle.GetPublicSign(buyer, {from: buyer});
        
        // Test ensures that the seller is the current owner of the NFT on-chain
        assert(oldOwner = seller);

        // These assertions ensure that data injection into oracle was successful
        assert(certif.EncodePropertyInfo(userOne[1]) == acc1Prop)
        assert(await certif.CreateSignature(seller, accs[0]) == acc1Sig);
        assert(await certif.CreateSignature(buyer, accs[0]) == acc2Sig);

        // 4) Seller starts an auction for their property
        // Establish parameters to represent the auction's behaviour
        var start = await web3.eth.getBlockNumber(); // Auction start block
        var end = start + 5; // Auction end block
        var min = "1000000000000000000" // Minimum allowed bid - 1 ether

        // Call with defined parameters to create a new auction contract from factory
        await propertyToken.NewAuction(start, end, min, pId, {from: seller});

        // Grab the newly created property auction address and establish auction details
        var auctionAddr = await propertyToken.auctions.call(1, {from: seller});
        console.log(`Auction Start: ${start} | Auction End: ${end}`);
        
        // 5) Establishing auction contract deployment
        const PropertyAuction = artifacts.require("PropertyAuction");
        const propertyAuction = await PropertyAuction.at(auctionAddr);

        // 6) userTwo bids to purchase the property (bids 2 ether)
        await propertyAuction.PlaceBid({from: buyer, value: "2000000000000000000"})

        // 7) Advance block time a few times to ensure auction has ended
        for (i = 0; i < 10; ++i) await evmMine();

        // 8) Winner claims property and auctioneer claims deposit
        var oldEther = await web3.eth.getBalance(seller);

        // Both contract calls are made from the respective user
        await propertyAuction.ClaimProperty({from: buyer});
        await propertyAuction.ClaimDeposit({from: seller});


        // 9) Ensure that property and ether is exchanged appropriately
        var newOwner = await propertyToken.ownerOf(1, {from: buyer});
        var newEther = await web3.eth.getBalance(seller);

        // Ensure that the seller has received 2 ether from the auction winner
        assert(newEther = oldEther + 2000000000000000000);

        // Ensure that the property's new owner is the auction winner
        assert(newOwner = buyer);
    });
});


/**
 * To advance the EVM (local node) block number for testing purpose
 * @returns {Object} ignorable
 */
function evmMine () {
    // Sample method of advancing block number for testing purpose
    // Sourced from stackoverflow.com [User: bguiz, Jan 25, 2021]
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: new Date().getTime()
            }, 
        (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
};