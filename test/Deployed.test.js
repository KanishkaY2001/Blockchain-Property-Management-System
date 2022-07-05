const PropertyOracle = artifacts.require("PropertyOracle");
const PropertyToken = artifacts.require("PropertyToken");

contract('PropertyOracle', (accounts) => {
    it("deploys contract properly", async () => {
        const propertyOracle = await PropertyOracle.deployed();
        const propertyToken = await PropertyToken.deployed();
        let cw1 = await propertyOracle.commonwealth.call({from: accounts[1]});
        //console.log(`Eth Address: ${propertyOracle.address}`);
        //console.log(`Eth Address: ${propertyToken.address}`);
        assert(cw1 == accounts[0]);
        assert(propertyOracle.address != '' && propertyToken.address != '');
    });
});