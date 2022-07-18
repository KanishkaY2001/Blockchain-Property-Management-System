//=======================================//
//          Initialize Libraries         //
//=======================================//

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
const onOracle = require("../build/contracts/PropertyOracle.json");
const onToken = require("../build/contracts/PropertyToken.json");

const InjectPublicSign = async (ethAddr, sign) => {
    const accs = await web3.eth.getAccounts();
    const oracle = new web3.eth.Contract(
        onOracle.abi,
        onOracle.networks[await web3.eth.net.getId()].address
    );

    // Inject public signature into on-chain oracle
    await oracle.methods.AddPublicSign(ethAddr, sign).call({from: accs[0]});
}
module.exports.InjectPublicSign = InjectPublicSign;


const InjectPropertyInfo = async (propertyID, ethAddr, prop) => {
    const accs = await web3.eth.getAccounts();
    const id = await web3.eth.net.getId();

    const oracle = new web3.eth.Contract(
        onOracle.abi,
        onOracle.networks[id].address
    );

    const token = new web3.eth.Contract(
        onToken.abi,
        onToken.networks[id].address
    );

    // Inject prop info into on-chain oracle
    var pid = await oracle.methods.AddPropertyInfo(propertyID, prop).call({from: accs[0]});
    await token.methods.DigitiseProperty(ethAddr, pid).call({from: accs[0]});
}
module.exports.InjectPropertyInfo = InjectPropertyInfo;