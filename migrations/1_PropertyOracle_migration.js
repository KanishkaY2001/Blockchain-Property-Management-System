const PropertyOracle = artifacts.require("PropertyOracle");

module.exports = function (deployer, network, accounts) {
    deployer.deploy(PropertyOracle, accounts[0], {from: accounts[0]});
};