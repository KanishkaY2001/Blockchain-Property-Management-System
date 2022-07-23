//=======================================//
//          Initialize Libraries         //
//=======================================//
const InjectPublicSign = async (ethAddr, sign, cw, artifacts) => {
    const PropertyOracle = artifacts.require("PropertyOracle");
    const propertyOracle = await PropertyOracle.deployed();

    // Inject public signature into on-chain oracle
    await propertyOracle.AddPublicSign(ethAddr, sign, { from: cw });
}
module.exports.InjectPublicSign = InjectPublicSign;


const InjectPropertyInfo = async (propertyID, ethAddr, cw, prop, artifacts) => {
    const PropertyOracle = artifacts.require("PropertyOracle");
    const PropertyToken = artifacts.require("PropertyToken");

    const propertyOracle = await PropertyOracle.deployed();
    const propertyToken = await PropertyToken.deployed(); 

    // Inject prop info into on-chain oracle
    await propertyOracle.AddPropertyInfo(propertyID, prop, {from: cw });
    // Digitize the property (convert into NFT)
    await propertyToken.DigitiseProperty(ethAddr, propertyID, {from: cw });
}
module.exports.InjectPropertyInfo = InjectPropertyInfo;