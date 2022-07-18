
//=======================================//
//          Initialize Libraries         //
//=======================================//

const ethers = require('ethers');
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));

const offOracle = require('./CommonwealthOracle.js');
const backendHook = require('./OwnershipRegistry.js');
const commonwealth = web3.eth.accounts.create(web3.utils.randomHex(32));



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

    // TEMPORARY SETTINGS:
    const accs = await web3.eth.getAccounts();
    ethAddr = accs[1]; // replace with ethAddr
    documents = [ // Use real documentation
        [
            "John Smith", // first and last name
            "16/08/1976", // date of birth
            "John_Smith@gmail.com", // email
            "0484132656", // phone number
            "23631261" // licence number
        ],
        [
            "2", // floors
            "4", // bedrooms
            "5", // bathrooms
            "31 Spooner Street", // address
            "1" // property ID
        ]
    ]
    var validated = backendHook.checkUserExists(documents[0][4]);
    // Step 1) verify documents if needed...
    if (!validated) {
        var validDocuments = false;
        //In reality this would be a lengthy, multi day processs so we use a off-chain database to store verification documents to store verified users so they dont have to verify multiple times
        validDocuments = true;
    }
    if (!validDocuments) return "Invaid Documents!";

    // Step 2) store verification documents in backend
    // Adds a new user along with their eth wallet and property
    recordInfo = {dob: documents[0][1], email: documents[0][2], driversLicenceNumber: parseInt(documents[0][4]), phoneNuber: parseInt(documents[0][3]), fullName: documents[0][0],
        numBedrooms: parseInt(documents[1][1]), numBathrooms: parseInt(documents[1][2]), streetAddress: documents[1][3], numFloors: parseInt(documents[1][0]), walletAddress: ethAddr.toString(), balance: 1}

    backendHook.AddNewUser(recordInfo);
    // Step 3) inject signature on-chain...
    const sign = CreateSignature(ethAddr).signature;
    offOracle.InjectPublicSign(ethAddr, sign);

    // Step 4) inject prop info on-chain...
    if (documents.length > 1) {
        const encoded = EncodePropertyInfo(documents[1]);
        offOracle.InjectPropertyInfo(ethAddr, encoded);
    }
}

function EncodePropertyInfo(property) {
    var propInfo = {
        "Floors": property[0],
        "Bedrooms": property[1],
        "Bathrooms": property[2],
        "Address": property[3]
    }
    return btoa(propInfo);
}
module.exports.EncodePropertyInfo = EncodePropertyInfo;


function CreateSignature(ethAddress) {
    const encoded = ethers.utils.solidityPack(["string", "address", "string"], 
    ["The Following Eth Address: ", ethAddress, " Is Certified To Participate."]);
    const signedCertificateMessage = web3.utils.keccak256(encoded).toString('hex');

    // The commonwealth performs this logic locally, through backend, to ensure that their private key is not compromised
    const publicSignatureVerificationKey = web3.eth.accounts.sign(signedCertificateMessage, commonwealth.privateKey);
    const verificationInfo = {
        signedMessage : publicSignatureVerificationKey.messageHash,
        signature : publicSignatureVerificationKey.signature
    }
    return verificationInfo;
}
module.exports.CreateSignature = CreateSignature;

//ApplicationForm("", "");

ApplicationForm();