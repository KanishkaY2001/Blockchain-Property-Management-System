//==============================================================================//
//                Inject Off-chain data into Centralized Oracle                 //
//==============================================================================//


/**
 * Inject user's public key signature data into on-chain oracle
 * @param {String} ethAddr user's public address
 * @param {String} sign user's public key signature data
 * @param {String} cw commonwealth's public address
 * @param {Object} artifacts local contract templates
 */
const InjectPublicSign = async (ethAddr, sign, cw, artifacts) => {
    // Grab compiled oracle contract template from build folder
    const PropertyOracle = artifacts.require("PropertyOracle");

    // Ensure that oracle contract is deployed onto the network
    const propertyOracle = await PropertyOracle.deployed();

    // Inject public signature into on-chain centralized oracle
    await propertyOracle.AddPublicSign(ethAddr, sign, { from: cw });
}
module.exports.InjectPublicSign = InjectPublicSign;


/**
 * Inject Base64 encoded JSON property data into on-chain oracle
 * @param {Integer} propertyID number which represents unique property ID
 * @param {String} ethAddr user's public address
 * @param {String} cw commonwealth's public address
 * @param {String} prop encoded property data
 * @param {Object} artifacts local contract templates
 */
const InjectPropertyInfo = async (propertyID, ethAddr, cw, prop, artifacts) => {
    // Grab compiled contract templates from build folder
    const PropertyOracle = artifacts.require("PropertyOracle");
    const PropertyToken = artifacts.require("PropertyToken");

    // Ensure that property contracts are deployed onto the network
    const propertyOracle = await PropertyOracle.deployed();
    const propertyToken = await PropertyToken.deployed(); 

    // Inject encoded property info into on-chain centralized oracle
    await propertyOracle.AddPropertyInfo(propertyID, prop, {from: cw });

    // Digitize the property (convert into NFT) and transfer to the user's address
    await propertyToken.DigitiseProperty(ethAddr, propertyID, {from: cw });
}
module.exports.InjectPropertyInfo = InjectPropertyInfo;