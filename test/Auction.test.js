const PropertyOracle = artifacts.require("PropertyOracle");
const PropertyToken = artifacts.require("PropertyToken");
const certif = require("../offchain/LandCertification.js");

contract('PropertyToken', (accs) => {
    it("auction and bidding functionality", async () => {

        // 0) Before anything, setup some familiar names to work with
        const seller = accs[1];
        const buyer = accs[2];


        // 1) Process begins by establishing smart contract existance
        const propertyOracle = await PropertyOracle.deployed();
        const propertyToken = await PropertyToken.deployed();


        // 2) The system requires users to be certified to participate
        var userOne = [["John Smith","16/08/1976","John_Smith@gmail.com","0484132656","23631261"],
            ["2","4","5","31 Spooner Street","1"]];
        await certif.ApplicationForm(seller, userOne);
        var pId = 1; // First property is always 1, then 2,3,..,n
        
        var userTwo = [["Jane Doe","16/08/1979","Jane_Doe@gmail.com","0414794634","23851368"],];
        await certif.ApplicationForm(buyer, userTwo);


        // 3) Ensure that userOne owns the property NFT, and both users are certified
        var oldOwner = await propertyToken.ownerOf(1, {from: seller});
        var acc1Sig = await propertyOracle.GetPublicSign(seller, {from: seller});
        var acc1Prop = await propertyOracle.GetPropertyInfo(pId, {from: seller});
        var acc2Sig = await propertyOracle.GetPublicSign(buyer, {from: buyer});

        assert(oldOwner = seller);
        assert(certif.EncodePropertyInfo(userOne[1]) == acc1Prop)
        assert(await certif.CreateSignature(seller) == acc1Sig);
        assert(await certif.CreateSignature(buyer) == acc2Sig);

        
        // 4) userOne starts an auction for their property
        var start = await web3.eth.getBlockNumber();
        var end = start + 5;
        var min = "1000000000000000000" // 10^18 wei = 1 Ether
        await propertyToken.NewAuction(start, end, min, pId, {from: seller});
        var auctionAddr = await propertyToken.auctions.call(1, {from: seller});
        console.log(`Auction Start: ${start} | Auction End: ${end}`);
        
        
        // 5) Establishing auction contract deployment
        const PropertyAuction = artifacts.require("PropertyAuction");
        const propertyAuction = await PropertyAuction.at(auctionAddr);//await PropertyAuction.deployed();


        // 6) userTwo bids to purchase the property (bids 2 ether)
        await propertyAuction.PlaceBid({from: buyer, value: "2000000000000000000"})


        // 7) Advance block time a few times to ensure auction has ended
        for (i = 0; i < 10; ++i) await evmMine();


        // 8) Winner claims property and auctioneer claims deposit
        var oldEther = await web3.eth.getBalance(seller);
        await propertyAuction.ClaimProperty({from: buyer});
        await propertyAuction.ClaimDeposit({from: seller});


        // 9) Ensure that property and ether is exchanged appropriately
        var newOwner = await propertyToken.ownerOf(1, {from: buyer});
        var newEther = await web3.eth.getBalance(seller);
        assert(newEther = oldEther + 2000000000000000000);
        assert(newOwner = buyer);
    });
});


// Sample method of advancing block number for testing purpose
// Sourced from stackoverflow.com [User: bguiz, Jan 25, 2021]
function evmMine () {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: new Date().getTime()
            }, 
        (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
};