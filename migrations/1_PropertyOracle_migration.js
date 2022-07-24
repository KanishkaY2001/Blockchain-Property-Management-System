//==============================================================================//
//                     Deployment of PropertyOracle Contract                    //
//==============================================================================//

//=======================================//
//     Initialize Contract Templates     //
//=======================================//

const PropertyOracle = artifacts.require("PropertyOracle");


/**
 * Responsible for deploying the PropertyOracle contract to the local node
 * @param {Object} deployer deploying node
 * @param {Object} network local node network information
 * @param {[String]} accounts predefined truffle accounts (public keys)
 */
module.exports = async function (deployer, network, accounts) {
    // Uses the first account within the truffle bank to deploy the Oracle contract
    // First account represents Commonwealth address
    deployer.deploy(PropertyOracle, {from: accounts[0]});
};