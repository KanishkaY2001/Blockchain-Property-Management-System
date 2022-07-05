const PropertyOracle = artifacts.require("PropertyOracle");
const PropertyToken = artifacts.require("PropertyToken");

module.exports = function (deployer, network, accounts) {
    deployer.deploy(PropertyToken, PropertyOracle.address, {from: accounts[0]});
};