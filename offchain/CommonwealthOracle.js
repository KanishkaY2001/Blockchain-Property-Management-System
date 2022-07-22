//=======================================//
//          Initialize Libraries         //
//=======================================//

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
const PropertyOracle = artifacts.require("PropertyOracle");
const PropertyToken = artifacts.require("PropertyToken");


const InjectPublicSign = async (ethAddr, sign) => {
    const accs = await web3.eth.getAccounts();
    const propertyOracle = await PropertyOracle.deployed();

    // Inject public signature into on-chain oracle
    await propertyOracle.AddPublicSign(ethAddr, sign, {from: accs[0]});
}
module.exports.InjectPublicSign = InjectPublicSign;


const InjectPropertyInfo = async (propertyID, ethAddr, prop) => {
    const accs = await web3.eth.getAccounts();
    const propertyOracle = await PropertyOracle.deployed();
    const propertyToken = await PropertyToken.deployed(); 

    // Inject prop info into on-chain oracle
    await propertyOracle.AddPropertyInfo(propertyID, prop, {from: accs[0]});
    // Digitize the property (convert into NFT)
    await propertyToken.DigitiseProperty(ethAddr, propertyID, {from: accs[0]});
}
module.exports.InjectPropertyInfo = InjectPropertyInfo;