//==============================================================================//
//                Unit Test - Ensure Data INjection into Oracle                 //
//==============================================================================//

//=======================================//
//     Initialize Contract Templates     //
//=======================================//

const PropertyOracle = artifacts.require("PropertyOracle");
const PropertyToken = artifacts.require("PropertyToken");

//=======================================//
//         Import Offchain Logic         //
//=======================================//

const certif = require("../offchain/LandCertification.js");
const backendHook = require('../offchain/OwnershipRegistry.js');


/**
 * Unit test which ensures that data is being injected into the oracle correctly
 * The test is conducted using two items - user's signature and property info URI
 * Both of these items should be injected onto the on-chain oracle properly
 */
contract('PropertyOracle', (accs) => {
    // Starting asynchronous unit test logic
    it("on-off chain data injection", async () => {

        // Ensure that property contracts are deployed onto the network
        const propertyOracle = await PropertyOracle.deployed();
        const propertyToken = await PropertyToken.deployed();
        
        // Emulating a license number to act as a primary key for backend user data
        let licenceNumber = "23631261"

        // Provide meaningful representation of local node user's account
        let ethAddr = accs[2]; // This is the property owner

        // This represents the user's public key signature, signed by Commonwealth
        let sign = await certif.CreateSignature(ethAddr);
        
        // Inject the user's signature on-chain onto the on-chain oracle
        await propertyOracle.AddPublicSign(ethAddr, sign, {from: accs[0]});
        
        // Retrieve the recently injected signature from the oracle contract
        let contractSign = await propertyOracle.GetPublicSign(ethAddr, {from: accs[0]});
        
        // Ensure that the grabbed signature is the same as the one injected off-chain
        // This ensures that signature insertion works propertly
        assert(sign == contractSign);

        // Define parameters that describe the property to inject to the on-chain oracle
        let propertyInfo = await backendHook.getOwnedProperty(licenceNumber);
        let pID = propertyInfo[0].propertyID; // The property's ID. First property will be ID = 1
        
        // Locally encodes the property into base64 JSON format for fixed length string storage
        let encoded = certif.EncodePropertyInfo([propertyInfo[0].NumFloors, propertyInfo[0].NumBedrooms, propertyInfo[0].NumBathrooms, propertyInfo[0].Address]);
       
        // Calling the oracle contract to inject encoded information on-chain
        await propertyOracle.AddPropertyInfo(pID, encoded, {from: accs[0]});
        let contractInfo = await propertyOracle.GetPropertyInfo(pID, {from: accs[0]});

        // Ensure that the grabbed property URI is the same as the one injected off-chain
        // This ensures that the property insertion works properly
        assert(encoded == contractInfo);

        // Additionally, attempt to convert the property into an NFT using encoded info as URI
        await propertyToken.DigitiseProperty(ethAddr, pID, {from: accs[0]});

        // Grab the current owner of the newly created property NFT
        // Ensure that the owner of the NFT is properly assigned to the user that digitized the property
        // This ensures that property digitization works properly
        let tokenOwner = await propertyToken.ownerOf(pID, {from: accs[0]})
        assert(tokenOwner == ethAddr);
    });
});