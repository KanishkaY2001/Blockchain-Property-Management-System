//==============================================================================//
//                     (1) Certify Users Within The System                      //
//==============================================================================//

//=======================================//
//    Initialize Libraries & Accounts    //
//=======================================//

const ethers = require('ethers');
const certif = require("../offchain/LandCertification.js");
const accs = require("./AccountBank").RopstenAccounts();
const commonW = accs[0] // Commonwealth information


/**
 * Users will undergo the application process
 * User information will be added to the Database
 * User Signature and property URI sent to Oracle
 */
module.exports = async function() {
    // Grab compiled contract templates from build folder
    const PropertyToken = artifacts.require("PropertyToken");
    const PropertyOracle = artifacts.require("PropertyOracle");

    // Provide meaningful representation of Ropsten accounts
    const seller = accs[1]; // Property owner and seller
    const bidder1 = accs[2]; // Bidder One
    const bidder2 = accs[3]; // Bidder Two

    console.log("Starting Ropsten Simulation:");
    console.log("============================")

    // Ensure that property contracts are deployed onto the network
    const propertyToken = await PropertyToken.deployed();
    const propertyOracle = await PropertyOracle.deployed();

    // Represent the smart contract testnet links for Property Oracle and Token
    console.log(`> PropertyOracle: https://ropsten.etherscan.io/address/${propertyOracle.address}`);
    console.log(`> PropertyToken: https://ropsten.etherscan.io/address/${propertyToken.address}`);

    // Provide certification for the seller
    await Certify(seller, artifacts); // Will be certified and property NFT will be transferred
    console.log(`> Certified the Seller: https://ropsten.etherscan.io/address/${seller.public}`);

    // Provide certification for the first bidder
    await Certify(bidder1, artifacts); // Will only be certified
    console.log(`> Certified Bidder One: https://ropsten.etherscan.io/address/${bidder1.public}`);
    
    // Provide certification for the second bidder
    await Certify(bidder2, artifacts); // Will only be certified
    console.log(`> Certified Bidder Two: https://ropsten.etherscan.io/address/${bidder2.public}`);
    console.log("> Proceed to next step... (CTRL + C)"); // Proceed to step 2
}


/**
 * Utility function which simulates certification app process
 * @param {Object} user account key-pair and documents
 * @param {Object} artifacts local contract templates
 */
const Certify = async (user, artifacts) => {
    // Application form format:
    await certif.ApplicationForm(
        user.public, // User's public key
        user.documents, // User's documentation, if any
        Signature(user.public), // Generated public key signature
        commonW.public, // Commonwealth's public key (for testing)
        artifacts // Local contract templates (builds)
    );
}
module.exports.Certify = Certify;


/**
 * Utility public key signature creation function for users
 * @param {String} public user's public key
 * @returns {String} user's public key signature
 */
function Signature(public) {
    // The Commonwealth performs this functionality locally to produce a certificate
    // The following encoded parameters represnt a message which certifies the user to participate in bidding
    const encoded = ethers.utils.solidityPack(["string", "address", "string"], 
    ["The Following Eth Address: ", public, " Is Certified To Participate."]);
    
    // Hash the encoded message through SHA / Keccak256 algorithm
    const signedCertificateMessage = web3.utils.keccak256(encoded).toString('hex');

    // The commonwealth performs this logic locally, through backend, to ensure that their private key is not compromised
    // JavaScript may be compromised as it is represented through plain text, so it is important to do this locally
    const publicSignatureVerificationKey = web3.eth.accounts.sign(signedCertificateMessage, commonW.private);

    // Verification information has been produced and can now be given to the investor to use as proof
    return publicSignatureVerificationKey.signature;
}