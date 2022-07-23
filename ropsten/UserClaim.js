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
    const bidder1 = accs[2];
    const bidder2 = accs[3];

    console.log("Users Can Claim Ether/Property:");
    console.log("===============================")
    
    var auctionAddr = await propertyToken.auctions.call(1, {from: seller.public});
    const PropertyAuction = artifacts.require("PropertyAuction");
    const propertyAuction = await PropertyAuction.at(auctionAddr);
    var wei = 1000000000000000000;

    // Show that seller got the ether from the auction winner
    var oldEth = parseFloat(await web3.eth.getBalance(seller.public)/wei).toFixed(3);
    await propertyAuction.ClaimDeposit({from: seller.public});
    var newEth = parseFloat(await web3.eth.getBalance(seller.public)/wei).toFixed(3);
    var diff = parseFloat(newEth - oldEth).toFixed(3);
    console.log(`> Seller Balance: [Previous: ${oldEth}] | [Now: ${newEth}] | [Gain: ${diff}]`);

    // Show that the loser got their ether deposit back
    oldEth = parseFloat(await web3.eth.getBalance(bidder1.public)/wei).toFixed(3);
    await propertyAuction.ClaimDeposit({from: bidder1.public});
    newEth = parseFloat(await web3.eth.getBalance(bidder1.public)/wei).toFixed(3);
    diff = parseFloat(newEth - oldEth).toFixed(3);
    console.log(`> Loser Balance: [Previous: ${oldEth}] | [Now: ${newEth}] | [Gain: ${diff}]`);

    await propertyAuction.ClaimProperty({from: bidder2.public});
    console.log(`> Winner Claimed Property: https://ropsten.etherscan.io/address/${bidder2.public}#tokentxnsErc721`)
    console.log(`> End of System Preview... (CTRL + C)`);
}