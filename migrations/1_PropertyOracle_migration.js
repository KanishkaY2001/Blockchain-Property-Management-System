//==============================================================================//
//                     Deployment of PropertyOracle Contract                    //
//==============================================================================//

//=======================================//
//     Initialize Contract Templates     //
//=======================================//

const PropertyOracle = artifacts.require("PropertyOracle");


/**
 * Responsible for deploying the PropertyOracle contract to the local node
 * @param {Object} deployer 
 * @param {Object} network 
 * @param {[String]} accounts 
 */
module.exports = async function (deployer, network, accounts) {
    // Uses the first account within the truffle bank to deploy the Oracle contract
    // First account represents Commonwealth address
    deployer.deploy(PropertyOracle, {from: accounts[0]});
};