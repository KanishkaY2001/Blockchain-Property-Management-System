
//=======================================//
//          Initialize Libraries         //
//=======================================//
const offOracle = require('./CommonwealthOracle.js');
const backendHook = require('./OwnershipRegistry.js');
const ethers = require('ethers');
const accs = require("../ropsten/AccountBank").RopstenAccounts();

// Front-end logic: (The user has to prove that they own their eth address and private key)
// This can be done by requiring the user to sign a message while they submit the application form
// This way, commonwealth can authenticate the user because they signed a tx using their private key.
// The public key used to call the smart contract function will be the verified eth address.

//  // Step 0) provide Documents...
const ApplicationForm = async (ethAddr, documents, sign, cw, artifacts) => {

    var hasProperty = documents.length == 2;
    var validated = backendHook.checkUserExists(documents[0][4]);

    // Step 1) verify documents if needed...
    if (!validated) {
        var validDocuments = false;
        // In reality this would be a lengthy, multi day processs so we use a off-chain database to store 
        // verification documents to store verified users so they dont have to verify multiple times
        if (!(validDocuments = true)) return "Invaid Documents!";
    }
    
    // Step 2) store verification documents in backend
    // Adds a new user along with their eth wallet and property
    recordInfo = {
        fullName: documents[0][0],
        dob: documents[0][1],
        email: documents[0][2],
        phoneNuber: parseInt(documents[0][3]),
        driversLicenceNumber: parseInt(documents[0][4]),
        walletAddress: ethAddr.toString(),
        balance: 1
    }

    propertyInfo = hasProperty ? {
        numFloors: parseInt(documents[1][0]),
        numBedrooms: parseInt(documents[1][1]),
        numBathrooms: parseInt(documents[1][2]),
        streetAddress: documents[1][3],
        propertyID: documents[1][4]
    } : false;

    // Step 3) inject signature on-chain...
    await backendHook.AddNewUser(recordInfo, propertyInfo);
    await offOracle.InjectPublicSign(ethAddr, sign, cw, artifacts);
    
    // Step 4) if user owns property, get property info from database
    if (!hasProperty) return;
    let data = await backendHook.getOwnedProperty(parseInt(documents[0][4]));

    // Step 5) inject prop info on-chain...
    const encoded = EncodePropertyInfo([data[0].NumFloors, data[0].NumBedrooms, data[0].NumBathrooms, data[0].Address]);
    await offOracle.InjectPropertyInfo(data[0].propertyID, ethAddr, cw, encoded, artifacts);
}
module.exports.ApplicationForm = ApplicationForm;


function EncodePropertyInfo(property) {
    var propInfo = {
        "Floors": property[0],
        "Bedrooms": property[1],
        "Bathrooms": property[2],
        "Address": property[3]
    }
    return propInfo.toString('base64');
}
module.exports.EncodePropertyInfo = EncodePropertyInfo;


const CreateSignature = async (public, cw) => {
    const encoded = ethers.utils.solidityPack(["string", "address", "string"], 
    ["The Following Eth Address: ", public, " Is Certified To Participate."]);

    const signedCertificateMessage = web3.utils.keccak256(encoded).toString('hex');
    const accs = await web3.eth.getAccounts();
    const signature = await web3.eth.sign(signedCertificateMessage, accs[0]);
    return signature;
}
module.exports.CreateSignature = CreateSignature;