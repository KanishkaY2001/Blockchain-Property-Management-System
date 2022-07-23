// offchain dependencies
const accs = require("./AccountBank").RopstenAccounts();
const Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider(
    'https://ropsten.infura.io/v3/d5497877f0194ea689e9df814179bd3d'
));

// Seller starts the auction
module.exports = async function() {
    const PropertyToken = artifacts.require("PropertyToken");
    const propertyToken = await PropertyToken.deployed();
    const seller = accs[1];

    console.log("Starting Property Auction:");
    console.log("==========================")

    var start = await web3.eth.getBlockNumber();
    var end = start + 20;
    var min = "10000000000000000" // 10^16 wei = 0.01 Ether
    await propertyToken.NewAuction(start, end, min, 1, {from: seller.public});
    
    var auctionAddr = await propertyToken.auctions.call(1, {from: seller.public});
    console.log(`> StartBlock: ${start}  |  EndBlock: ${end}  |  MinBid: 0.01 ether`);
    console.log(`> PropertyAuction: https://ropsten.etherscan.io/address/${auctionAddr}`);
    console.log("> Proceed to next step... (CTRL + C)");
}