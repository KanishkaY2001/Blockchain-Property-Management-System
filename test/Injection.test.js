const PropertyOracle = artifacts.require("PropertyOracle");
const PropertyToken = artifacts.require("PropertyToken");
const certif = require("../offchain/LandCertification.js");
const backendHook = require('../offchain/OwnershipRegistry.js');

contract('PropertyOracle', (accs) => {
    it("on-off chain data injection", async () => {
        const propertyOracle = await PropertyOracle.deployed();
        const propertyToken = await PropertyToken.deployed();

        let licenceNumber = "23631261"

        let ethAddr = accs[2];
        let sign = await certif.CreateSignature(ethAddr);

        await propertyOracle.AddPublicSign(ethAddr, sign, {from: accs[0]});
        let contractSign = await propertyOracle.GetPublicSign(ethAddr, {from: accs[0]});
        
        assert(sign == contractSign);
        let propertyInfo = await backendHook.getOwnedProperty(licenceNumber);
        let pID = propertyInfo[0].propertyID;
        let encoded = certif.EncodePropertyInfo([propertyInfo[0].NumFloors, propertyInfo[0].NumBedrooms, propertyInfo[0].NumBathrooms, propertyInfo[0].Address]);
        await propertyOracle.AddPropertyInfo(pID, encoded, {from: accs[0]});
        let contractInfo = await propertyOracle.GetPropertyInfo(pID, {from: accs[0]});
        
        assert(encoded == contractInfo);

        await propertyToken.DigitiseProperty(ethAddr, pID, {from: accs[0]});

        let tokenOwner = await propertyToken.ownerOf(pID, {from: accs[0]})
        assert(tokenOwner == ethAddr);
    });

});