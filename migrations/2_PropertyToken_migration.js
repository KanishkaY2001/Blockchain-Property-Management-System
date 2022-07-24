//==============================================================================//
//                     Deployment of PropertyToken Contract                     //
//==============================================================================//

//=======================================//
//     Initialize Contract Templates     //
//=======================================//

const PropertyOracle = artifacts.require("PropertyOracle");
const PropertyToken = artifacts.require("PropertyToken");


/**
 * Responsible for deploying the PropertyToken contract to the local node
 * @param {*} deployer deploying node
 * @param {*} network local node network information
 * @param {*} accounts predefined truffle accounts (public keys)
 */
module.exports = function (deployer, network, accounts) {
    // Passes the PropertyOracle address as a parameter to establish a trusted oracle source
    deployer.deploy(PropertyToken, PropertyOracle.address, {from: accounts[0]});
};