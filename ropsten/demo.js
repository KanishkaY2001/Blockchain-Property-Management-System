// Import Ropsten Wallets
const HDWalletProvider = require('@truffle/hdwallet-provider');

const ACC1_ADDR = '0x4E8C9D62B30a28397A3e36E0Ac88FD4c6C833d2E';  // Ethereum address
const ACC1_PKEY = '473537deb539628190f4611df62383c333baf198a3c96a7080392322fa090fce';    // Private key (without 0x at the beginning)

const ACC2_ADDR = '0x7cf85281115700752a4a4201e49f5f5b6D3B22bF';  // Ethereum address
//const ACC2_PKEY = 'c80171d8b7303dd3cd1198f462d0d7b751e51bbb1ae2f88828174d77b55810dc';    // Private key

const ACC3_ADDR = '0xA113272C561275F3AE4A7DB6510261f31659831c';  // Ethereum address
//const ACC3_PKEY = '59cb18ddb6e88f99609af82c1b08a0584c04856d06ef0a3f6d274abea81d8788';    // Private key

const ACC4_ADDR = '0xcc8EEC939E663C91090B9B35e460D85e2A93CbdA';  // Ethereum address
//const ACC4_PKEY = '67bb7c25da33ba04fa1e0865dcef858995576a4a09de3f05ffde5074df39df02';    // Private key

const ACC5_ADDR = '0x70Ee7627C1086f4cBc2E8941A965090E64512B96';  // Ethereum address
//const ACC5_PKEY = '3a695e91c4d8249c3f65caf9633db22e56dd3b54744659ae34218d2a98e03dba';    // Private key

//const privateKeys = [ACC1_PKEY,ACC2_PKEY]

//Import Contracts
const PropertyToken = artifacts.require("PropertyToken");
const PropertyOracle = artifacts.require("PropertyOracle");



//Import Off-Chain Code
const certif = require("../offchain/LandCertification.js");
const backendHook = require('../offchain/OwnershipRegistry.js');


module.exports = async function(callback) {
    const propertyToken = await PropertyToken.deployed();
    const propertyOracle = await PropertyOracle.deployed();

    console.log(propertyOracle.address);
    

    // Create Property Owner Signature (ie ACC2)
    let sign = await certif.CreateSignature(ACC2_ADDR,ACC1_PKEY);

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
        console.log("Token Address: ",propertyToken.address);
    }	

    await propertyToken.transferFrom('0x7cf85281115700752a4a4201e49f5f5b6D3B22bF','0x3AF7205BAD872e7200986F68cbAd74f01ab6AbD6',1, { from: ACC2_ADDR });
    
    // Generate Signed Certificates to verify auction participants
    var ACC3_CERT = await certif.CreateSignature(ACC3_ADDR,ACC1_PKEY);
    console.log("Created Signature For ACC3.")
    var ACC4_CERT = await certif.CreateSignature(ACC4_ADDR,ACC1_PKEY);
    console.log("Created Signature For ACC4.")
    var ACC5_CERT = await certif.CreateSignature(ACC5_ADDR,ACC1_PKEY);
    console.log("Created Signature For ACC5.")

    await propertyOracle.AddPublicSign(ACC3_ADDR, ACC3_CERT,{ from: ACC1_ADDR });
    console.log("Added Signature For ACC3.")
    await propertyOracle.AddPublicSign(ACC4_ADDR, ACC4_CERT,{ from: ACC1_ADDR });
    console.log("Added Signature For ACC4.")
    await propertyOracle.AddPublicSign(ACC5_ADDR, ACC5_CERT,{ from: ACC1_ADDR });
    console.log("Added Signature For ACC5.")

    console.log(await propertyOracle.GetPublicSign(ACC3_ADDR),{ from: ACC1_ADDR });

     console.log(await propertyToken.VerifySignature(ACC3_ADDR),{ from: ACC1_ADDR });


    //Create Auction (min bid 100 wei)
    //var auction = await propertyToken.NewAuction(12643274, 12643294, 100, 1,{ from: ACC2_ADDR });

    console.log( await propertyToken.auctions.call(1, {from: ACC1_ADDR}));
    //var auctionAddr =

    var auctionAddr = await propertyToken.auctions.call(1, {from: ACC2_ADDR});
    const PropertyAuction = artifacts.require("PropertyAuction");
    const propertyAuction = await PropertyAuction.at(auctionAddr);


    await propertyAuction.PlaceBid({ from: ACC3_ADDR, value: 1 * 10^16});
    
   
    console.log(await propertyAuction.topAddr," is the current top bidder with a value of ",await propertyAuction.topBid,"wei");
    


   // auction.PlaceBid({ from: ACC4_ADDR }, {value: 1 * 10^16});



	callback();
}

