// Import Ropsten Wallets
const HDWalletProvider = require('@truffle/hdwallet-provider');

const ACC1_ADDR = '0x4E8C9D62B30a28397A3e36E0Ac88FD4c6C833d2E';  // Ethereum address
const ACC1_PKEY = '473537deb539628190f4611df62383c333baf198a3c96a7080392322fa090fce';    // Private key (without 0x at the beginning)
const ACC2_ADDR = '0x7cf85281115700752a4a4201e49f5f5b6D3B22bF';  // Ethereum address
const ACC2_PKEY = 'c80171d8b7303dd3cd1198f462d0d7b751e51bbb1ae2f88828174d77b55810dc';    // Private key

const privateKeys = [ACC1_PKEY,ACC2_PKEY]

//Import Contracts
const PropertyToken = artifacts.require("PropertyToken");
const PropertyOracle = artifacts.require("PropertyOracle");



//Import Off-Chain Code
const certif = require("../offchain/LandCertification.js");
const backendHook = require('../offchain/OwnershipRegistry.js');


module.exports = async function(callback) {
        // var hello = await HelloWorld.deployed().then(function(instance){return instance.sayHello()});

    // console.log(hello);

    const propertyToken = await PropertyToken.deployed();
    const propertyOracle = await PropertyOracle.deployed();

    // var cw = await propertyOracle.commonwealth.call();

    // console.log(cw);

    

    // Create Property Owner Signature (ie ACC2)
    let sign = await certif.CreateSignature(ACC2_ADDR);

    // Add Owner's Signature to Oracle as Commonwealth (ie ACC1)
    await propertyOracle.AddPublicSign(ACC2_ADDR, sign,{ from: ACC1_ADDR });   

    // Check success from ACC2
    let contractSign = await propertyOracle.GetPublicSign(ACC2_ADDR, { from: ACC2_ADDR });

    if (sign == contractSign) {
        console.log("SUCCESS! Signature from the Oracle matches.");
    }


    // Get Property Info From AWS Database
    let licenceNumber = "23631261";
    let propertyInfo = await backendHook.getOwnedProperty(licenceNumber);

    console.log("Property Info from AWS:", propertyInfo);

    // Upload Property Info To Oracle as Commomwealth
    let pID = propertyInfo[0].propertyID;
    let encoded = certif.EncodePropertyInfo([propertyInfo[0].NumFloors, propertyInfo[0].NumBedrooms, propertyInfo[0].NumBathrooms, propertyInfo[0].Address]);
    
    await propertyOracle.AddPropertyInfo(pID, encoded, { from: ACC1_ADDR });

    // Check success from ACC2
    let propertyInfoOracle = await propertyOracle.GetPropertyInfo(pID, { from: ACC2_ADDR });

    if (encoded == propertyInfoOracle) {
        console.log("SUCCESS! Info from the Oracle matches.");
    }
    
    // Digitise Property as Commonwealth 
    await propertyToken.DigitiseProperty(ACC2_ADDR, pID, { from: ACC1_ADDR });


    // Check success from ACC2
    let tokenOwner = await propertyToken.ownerOf(pID, { from: ACC2_ADDR });
    
    if (tokenOwner == ACC2_ADDR) {
        console.log("SUCCESS! ACC2 is the proud owner of ProperToken #",pID);
    }	
	callback();
}

