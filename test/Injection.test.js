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
        let sign = certif.CreateSignature(ethAddr).signature;

        await propertyOracle.AddPublicSign(ethAddr, sign, {from: accs[0]});
        let contractSign = await propertyOracle.GetPublicSign(ethAddr, {from: accs[0]});
        
        assert(sign == contractSign);

        backendHook.getOwnedProperty(ethAddr, part2, licenceNumber);

        async function part2(ethAddr, data){
            let pID = data[0].propertyID;
            let encoded = certif.EncodePropertyInfo([data[0].NumFloors, data[0].NumBedrooms, data[0].NumBathrooms, data[0].Address]);
            await propertyOracle.AddPropertyInfo(pID, encoded, {from: accs[0]});
            let contractInfo = await propertyOracle.GetPropertyInfo(pID, {from: accs[0]});
            
            assert(encoded == contractInfo);

            await propertyToken.DigitiseProperty(ethAddr, pID, {from: accs[0]});

            let tokenOwner = await propertyToken.ownerOf(pID, {from: accs[0]})
            assert(tokenOwner == ethAddr);
        }
    });

});