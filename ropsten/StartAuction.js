//==============================================================================//
//                     (2) Starting a New Property Auction                      //
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
 * Seller will proceed to create an auction for their property NFT
 * Auction details will be addressed and provided to the contract
 */
module.exports = async function() {
    // Grab compiled contract templates from build folder
    const PropertyToken = artifacts.require("PropertyToken");

    // Ensure that token contract is deployed onto the network
    const propertyToken = await PropertyToken.deployed();

    // Provide meaningful representation of Seller's account
    const seller = accs[1]; // Property owner and seller

    console.log("Starting Property Auction:");
    console.log("==========================")

    // Establish parameters to represent the auction's behaviour
    var start = await web3.eth.getBlockNumber(); // Auction start block
    var end = start + 20; // Auction end block
    var min = "10000000000000000" // Minimum allowed bid - 0.01 ether

    // Call with defined parameters to create a new auction contract from factory
    await propertyToken.NewAuction(start, end, min, 1, {from: seller.public});
    
    // Get property auction contract address from NFT ID (Value = 1 because first NFT)
    var auctionAddr = await propertyToken.auctions.call(1, {from: seller.public});
    console.log(`> StartBlock: ${start}  |  EndBlock: ${end}  |  MinBid: 0.01 ether`);

    // Represent the auction contract testnet link for the user to verify
    console.log(`> PropertyAuction: https://ropsten.etherscan.io/address/${auctionAddr}`);
    console.log("> Proceed to next step... (CTRL + C)"); // Proceed to step 3
}