// offchain dependencies
const accs = require("./AccountBank").RopstenAccounts();

// Users undergo the application process
module.exports = async function() {
    const PropertyToken = artifacts.require("PropertyToken");
    const PropertyOracle = artifacts.require("PropertyOracle");

    const bidder1 = accs[2];
    const bidder2 = accs[3];

    console.log("Bidders Will Place Bids:");
    console.log("========================")

    const propertyToken = await PropertyToken.deployed();
    const propertyOracle = await PropertyOracle.deployed();

    var auctionAddr = await propertyToken.auctions.call(1, {from: bidder1.public});
    const PropertyAuction = artifacts.require("PropertyAuction");
    const propertyAuction = await PropertyAuction.at(auctionAddr);

    // Bidder One bids to purchase the property (bids 0.02 ether)
    await propertyAuction.PlaceBid({from: bidder1.public, value: "20000000000000000"})
    console.log("> Bidder One bids 0.02 ether");

    // Bidder Two bids to purchase the property (bids 0.04 ether)
    await propertyAuction.PlaceBid({from: bidder2.public, value: "40000000000000000"})
    console.log("> Bidder Two bids 0.04 ether");

    // maybe get highest bidder
    var start = await web3.eth.getBlockNumber();
    console.log(`> CurrBlock: ${start}  |  Proceed to next step... (CTRL + C)`);
}