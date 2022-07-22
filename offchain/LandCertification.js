
//=======================================//
//          Initialize Libraries         //
//=======================================//

const ethers = require('ethers');
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));

const offOracle = require('./CommonwealthOracle.js');
const backendHook = require('./OwnershipRegistry.js');

// Front-end logic: (The user has to prove that they own their eth address and private key)
// This can be done by requiring the user to sign a message while they submit the application form
// This way, commonwealth can authenticate the user because they signed a tx using their private key.
// The public key used to call the smart contract function will be the verified eth address.

/*
var investorAccount = web3.eth.accounts.create(web3.utils.randomHex(32));
var investorAddress = investorAccount.address;

const verificationMessage = "I control the private and public keys";
const signedVerificationMessage = web3.utils.keccak256(ethers.utils.solidityPack(["string"], [verificationMessage])).toString('hex');
const investorSignature = web3.eth.accounts.sign(signedVerificationMessage, investorAccount.privateKey).signature;

function checkInvestorValidity(publicSignatureVerificationKey, address) {
    return address == web3.eth.accounts.recover(signedVerificationMessage, publicSignatureVerificationKey);
}

if (checkInvestorValidity(investorSignature, investorAddress)) CreateSignature(investorAddress);
*/

//  // Step 0) provide Documents...
const ApplicationForm = async (ethAddr, documents) => {

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

    backendHook.AddNewUser(recordInfo, propertyInfo);

    // Step 3) inject signature on-chain...
    const sign = await CreateSignature(ethAddr);
    await offOracle.InjectPublicSign(ethAddr, sign);

    // Step 4) if user owns property, get property info from database
    if (!hasProperty) return;
    let data = await backendHook.getOwnedProperty(parseInt(documents[0][4]));

    // Step 5) inject prop info on-chain...
    const encoded = EncodePropertyInfo([data[0].NumFloors, data[0].NumBedrooms, data[0].NumBathrooms, data[0].Address]);
    await offOracle.InjectPropertyInfo(data[0].propertyID, ethAddr, encoded);
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


// const CreateSignature = async (ethAddress, cw) => {
//     const encoded = ethers.utils.solidityPack(["string", "address", "string"], 
//     ["The Following Eth Address: ", ethAddress, " Is Certified To Participate."]);

//     const signedCertificateMessage = web3.utils.keccak256(encoded).toString('hex');
//     const accs = await web3.eth.getAccounts();
//     const signature = await web3.eth.sign(signedCertificateMessage, cw);
//     console.log(accs[0]);
//     return signature;
// }
function CreateSignature(ethAddress,pK) {
    const encoded = ethers.utils.solidityPack(["string", "address", "string"], 
    ["The Following Eth Address: ", ethAddress, " Is Certified To Participate."]);
    const signedCertificateMessage = web3.utils.keccak256(encoded).toString('hex');

    // The commonwealth performs this logic locally, through backend, to ensure that their private key is not compromised
    const publicSignatureVerificationKey = web3.eth.accounts.sign(signedCertificateMessage, pK);
    const verificationInfo = {
        signedMessage : publicSignatureVerificationKey.messageHash,
        signature : publicSignatureVerificationKey.signature
    }
    return publicSignatureVerificationKey.signature;
}
module.exports.CreateSignature = CreateSignature;