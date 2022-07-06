const PropertyOracle = artifacts.require("PropertyOracle");
const PropertyToken = artifacts.require("PropertyToken");
const certif = require("../offchain/LandCertification.js");

contract('PropertyOracle', (accs) => {
    it("on-off chain data injection", async () => {
        const propertyOracle = await PropertyOracle.deployed();
        const propertyToken = await PropertyToken.deployed();

        let documents = [ // Use real documentation
            [
                "John Smith", // first and last name
                "16/08/1976", // date of birth
                "John_Smith@gmail.com", // email
                "0484132656", // phone number
                "23631261" // licence number
            ],
            [
                "2", // floors
                "4", // bedrooms
                "5", // bathrooms
                "31 Spooner Street" // address
            ]
        ]

        let ethAddr = accs[2];
        let sign = certif.CreateSignature(ethAddr).signature;
        let encoded = certif.EncodePropertyInfo(documents[1]);

        await propertyOracle.AddPublicSign(ethAddr, sign, {from: accs[0]});
        let contractSign = await propertyOracle.GetPublicSign(ethAddr, {from: accs[0]});
        
        assert(sign == contractSign);
        //let x = await propertyOracle.AddPropertyInfo(encoded, {from: accs[0]});
        //await propertyToken.DigitiseProperty(ethAddr, pid, {from: accs[0]});
    });
});