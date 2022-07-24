//==============================================================================//
//                    (3) Users Will Place Bids On Property                     //
//==============================================================================//

//=======================================//
//          Initialize Accounts          //
//=======================================//

const accs = require("./AccountBank").RopstenAccounts();


/**
 * Non-selling users will proceed to place bids on the auctioned property
 * Bid information will be recorded and used in the auction contract
 * Bids are to be placed on a block within the start and end block
 */
module.exports = async function() {
    // Grab compiled token contract template from build folder
    const PropertyToken = artifacts.require("PropertyToken");

    // Provide meaningful representation of Ropsten accounts
    const bidder1 = accs[2]; // Bidder One
    const bidder2 = accs[3]; // Bidder Two

    console.log("Bidders Will Place Bids:");
    console.log("========================")

    // Ensure that token contract is deployed onto the network
    const propertyToken = await PropertyToken.deployed();

    // Get property auction contract address from NFT ID (Value = 1 because first NFT)
    var auctionAddr = await propertyToken.auctions.call(1, {from: bidder1.public});

    // Grab compiled contract template from build folder and define it using its address
    const PropertyAuction = artifacts.require("PropertyAuction");
    const propertyAuction = await PropertyAuction.at(auctionAddr);

    // Bidder One bids to purchase the property (bids 0.02 ether) (min bid = 0.01)
    await propertyAuction.PlaceBid({from: bidder1.public, value: "20000000000000000"})
    console.log("> Bidder One bids 0.02 ether");

    // Bidder Two bids to purchase the property (bids 0.04 ether) (min bid = 0.01)
    await propertyAuction.PlaceBid({from: bidder2.public, value: "40000000000000000"})
    console.log("> Bidder Two bids 0.04 ether");

    // Both bids are successful as users are certified and placed bid within start - end block
    var start = await web3.eth.getBlockNumber();
    console.log(`> CurrBlock: ${start}  |  Proceed to next step... (CTRL + C)`);
}