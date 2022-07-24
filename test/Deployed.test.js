//==============================================================================//
//                    Unit Test - Ensure Contract Deployment                    //
//==============================================================================//

//=======================================//
//     Initialize Contract Templates     //
//=======================================//

const PropertyOracle = artifacts.require("PropertyOracle");
const PropertyToken = artifacts.require("PropertyToken");


/**
 * Unit test which ensures that contracts are deployed to the network
 * Test to ensure contract addresses are grabbable and commonwealth exists
 */
contract('PropertyOracle', (accounts) => {
    // Starting asynchronous unit test logic
    it("deploys contract properly", async () => {
        
        // Ensure that property contracts are deployed onto the network
        const propertyOracle = await PropertyOracle.deployed();
        const propertyToken = await PropertyToken.deployed();

        // Grab the public commonwealth address stored in the oracle smart contract
        let cw1 = await propertyOracle.commonwealth.call({from: accounts[1]});

        // Ensure that commonwealth address on contract is the intended address
        assert(cw1 == accounts[0]);

        // Ensure that both property smart contracts exist in the network
        assert(propertyOracle.address != '' && propertyToken.address != '');
    });
});