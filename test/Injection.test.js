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
                "31 Spooner Street", // address
                "1", // property ID
            ]
        ]

        let ethAddr = accs[2];
        let sign = certif.CreateSignature(ethAddr).signature;
        let encoded = certif.EncodePropertyInfo(documents[1]);

        await propertyOracle.AddPublicSign(ethAddr, sign, {from: accs[0]});
        let contractSign = await propertyOracle.GetPublicSign(ethAddr, {from: accs[0]});
        
        assert(sign == contractSign);

        //change from 1 to pid from db
        await propertyOracle.AddPropertyInfo(1, encoded, {from: accs[0]});
        //change from 1 to pid from db
        let contractInfo = await propertyOracle.GetPropertyInfo(1, {from: accs[0]});
        
        assert(encoded == contractInfo);

        
        //change from 1 to pid from db
        await propertyToken.DigitiseProperty(ethAddr, 1, {from: accs[0]});

        //change from 1 to pid from db
        let tokenOwner = await propertyToken.ownerOf(1, {from: accs[0]})
        assert(tokenOwner == ethAddr);


    });

});