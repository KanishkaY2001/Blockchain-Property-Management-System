// offchain dependencies
const ethers = require('ethers');
const certif = require("../offchain/LandCertification.js");
const accs = require("./AccountBank").RopstenAccounts();
const commonW = accs[0]


// Users undergo the application process
module.exports = async function() {
    const PropertyToken = artifacts.require("PropertyToken");
    const PropertyOracle = artifacts.require("PropertyOracle");

    const seller = accs[1];
    const bidder1 = accs[2];
    const bidder2 = accs[3];

    console.log("Starting Ropsten Simulation:");
    console.log("============================")

    const propertyToken = await PropertyToken.deployed();
    const propertyOracle = await PropertyOracle.deployed();

    console.log(`> PropertyOracle: https://ropsten.etherscan.io/address/${propertyOracle.address}`);
    console.log(`> PropertyToken: https://ropsten.etherscan.io/address/${propertyToken.address}`);

    await Certify(seller, artifacts);
    console.log(`> Certified the Seller: https://ropsten.etherscan.io/address/${seller.public}`);
    await Certify(bidder1, artifacts);
    console.log(`> Certified Bidder One: https://ropsten.etherscan.io/address/${bidder1.public}`);
    await Certify(bidder2, artifacts);
    console.log(`> Certified Bidder Two: https://ropsten.etherscan.io/address/${bidder2.public}`);
    console.log("> Proceed to next step... (CTRL + C)");
}


const Certify = async (user, artifacts) => {
    await certif.ApplicationForm(
        user.public, 
        user.documents, 
        Signature(user.public), 
        commonW.public,
        artifacts
    );
}
module.exports.Certify = Certify;


function Signature(public) {
    const encoded = ethers.utils.solidityPack(["string", "address", "string"], 
    ["The Following Eth Address: ", public, " Is Certified To Participate."]);
    const signedCertificateMessage = web3.utils.keccak256(encoded).toString('hex');

    // The commonwealth performs this logic locally, through backend, to ensure that their private key is not compromised
    const publicSignatureVerificationKey = web3.eth.accounts.sign(signedCertificateMessage, commonW.private);
    return publicSignatureVerificationKey.signature;
}