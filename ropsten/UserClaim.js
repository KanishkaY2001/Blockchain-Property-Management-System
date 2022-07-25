//==============================================================================//
//                   (4) Users Will Claim Deposit / Property                    //
//==============================================================================//

//=======================================//
//    Initialize Libraries & Accounts    //
//=======================================//

const accs = require("./AccountBank").RopstenAccounts();
const key = require("./AccountBank").RopstenKey();
const Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider(
    `https://ropsten.infura.io/v3/${key}`
)); // Connecting to Ropsten testnet to access testnet information


/**
 * Users will proceed to claim their property or their owed deposit
 * Seller (previous owner) will receive deposit from auction winner
 * Loser will receive the deposit they have put into the contract
 * Winner will receive the property NFT (transferred to their address)
 */
module.exports = async function() {
    // Grab compiled token contract template from build folder
    const PropertyToken = artifacts.require("PropertyToken");

    // Ensure that token contract is deployed onto the network
    const propertyToken = await PropertyToken.deployed();

    // Provide meaningful representation of Ropsten accounts
    const seller = accs[1]; // Property owner and seller
    const bidder1 = accs[2]; // Bidder One
    const bidder2 = accs[3]; // Bidder Two

    console.log("Users Can Claim Ether/Property:");
    console.log("===============================")
    
    // Get property auction contract address from NFT ID (Value = 1 because first NFT)
    var auctionAddr = await propertyToken.auctions.call(1, {from: seller.public});

    // Grab compiled contract template from build folder and define it using its address
    const PropertyAuction = artifacts.require("PropertyAuction");
    const propertyAuction = await PropertyAuction.at(auctionAddr);
    var wei = 1000000000000000000; // 10^18 (1 ether) used for console output

    // Show that seller got the ether from the auction winner
    var oldEth = parseFloat(await web3.eth.getBalance(seller.public)/wei).toFixed(3);
    await propertyAuction.ClaimDeposit({from: seller.public}); // Will receive winner's deposit
    var newEth = parseFloat(await web3.eth.getBalance(seller.public)/wei).toFixed(3);
    var diff = parseFloat(newEth - oldEth).toFixed(3); // To showcase an increase in their balance
    console.log(`> Seller Balance: [Previous: ${oldEth}] | [Now: ${newEth}] | [Gain: ${diff}]`);

    // Show that the loser got their ether deposit back
    oldEth = parseFloat(await web3.eth.getBalance(bidder1.public)/wei).toFixed(3);
    await propertyAuction.ClaimDeposit({from: bidder1.public}); // Will receive their own deposit
    newEth = parseFloat(await web3.eth.getBalance(bidder1.public)/wei).toFixed(3);
    diff = parseFloat(newEth - oldEth).toFixed(3); // To showcase they had their ether returned
    console.log(`> Loser Balance: [Previous: ${oldEth}] | [Now: ${newEth}] | [Gain: ${diff}]`);

    // Show that the winner was transferred the property NFT
    await propertyAuction.ClaimProperty({from: bidder2.public});

    // The following link will showcase the newly transferred NFT into the user's account
    console.log(`> Winner Claimed Property: https://ropsten.etherscan.io/address/${bidder2.public}#tokentxnsErc721`)
    console.log(`> End of System Preview... (CTRL + C)`);
}