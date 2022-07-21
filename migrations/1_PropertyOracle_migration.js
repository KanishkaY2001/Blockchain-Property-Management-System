const PropertyOracle = artifacts.require("PropertyOracle");

module.exports = async function (deployer, network, accounts) {
    console.log(accounts[0]);
    deployer.deploy(PropertyOracle, {from: accounts[0]});
};