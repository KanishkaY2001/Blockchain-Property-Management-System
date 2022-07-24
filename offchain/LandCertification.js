//==============================================================================//
//                Inject Off-chain data into Centralized Oracle                 //
//==============================================================================//

/**
 * FUNCTIONAL CONTEXT:
 * ===================
 * Front-end logic: (The user has to prove that they own their eth address and private key)
 * This can be done by requiring the user to sign a message while they submit the application form
 * This way, commonwealth can authenticate the user because they signed a tx using their private key.
 * The public key used to call the smart contract function will be the verified eth address.
 * Note: The functionality displayed in this file will not be called directly by the user.
 */

//=======================================//
//    Initialize Libraries and Imports   //
//=======================================//

const offOracle = require('./DataInjector.js');
const backendHook = require('./OwnershipRegistry.js');
const ethers = require('ethers');


/**
 * The bridge of interaction between uncertified users and the commonwealth interface
 * @Property_Owner will provide property details along with personal details Property 
 * NFT will be generated and transferred to their eth account
 * @Regular_Bidder will provide only personal details
 * @param {String} ethAddr user's public address
 * @param {[String]} documents user's personal documents
 * @param {String} sign user's public key signature
 * @param {String} cw commonwealth's public address
 * @param {Object} artifacts local contract templates
 * @returns {Null} case: no property provided
 */
const ApplicationForm = async (ethAddr, documents, sign, cw, artifacts) => {
    // Step 0) provide Documents
    // True if the user has provided property details, false otherwise
    var hasProperty = documents.length == 2;
    var validated = backendHook.checkUserExists(documents[0][4]);


    // Step 1) verify provided documents if user is not certified
    if (!validated) {
        // Initially, assume user has provided invalid documentation
        var validDocuments = false;

        // In reality this would be a lengthy, multi day processs 
        // so we use a off-chain database to store  verification documents 
        // to store verified users so they dont have to verify multiple times
        if (!(validDocuments = true)) return "Invaid Documents!";
    }
    

    // Step 2) store verification documents in backend
    // A dictionary of user's personal details, to be stored
    recordInfo = {
        fullName: documents[0][0], // Full name
        dob: documents[0][1], // Date of Birth
        email: documents[0][2], // Email Address
        phoneNuber: parseInt(documents[0][3]), // Phone #
        driversLicenceNumber: parseInt(documents[0][4]), // Licence #
        walletAddress: ethAddr.toString(), // Ethereum Wallet Address
    }

    // A dictionary of the user's property architectural details
    // This information is only concerned if the user provides property info
    propertyInfo = hasProperty ? {
        numFloors: parseInt(documents[1][0]), // # of floors
        numBedrooms: parseInt(documents[1][1]), // # of bedrooms
        numBathrooms: parseInt(documents[1][2]), // # of bathrooms
        streetAddress: documents[1][3], // Physical street address
        propertyID: documents[1][4] // A unique property address
    } : false; // If no property info is provided, set to false


    // Step 3) inject signature on-chain
    // Add user details to backend database
    await backendHook.AddNewUser(recordInfo, propertyInfo);

    // Inject user's public key signature into on-chain oracle
    await offOracle.InjectPublicSign(ethAddr, sign, cw, artifacts);
    

    // Step 4) if user owns property, get property info from database
    if (!hasProperty) return; // case: no property info given

    // Get property information from backend database using propertyID
    let data = await backendHook.getPropertyInfoFromDatabase(parseInt(documents[1][4]));


    // Step 5) inject property URI info on-chain...
    await offOracle.InjectPropertyInfo(
        data[0].propertyID, // Unique property ID
        ethAddr, // User's public address
        cw, // Commonwealth
        // Base64 encoded JSON property URI
        EncodePropertyInfo(
            [data[0].NumFloors, 
            data[0].NumBedrooms, 
            data[0].NumBathrooms, 
            data[0].Address]
        ), 
        artifacts // Local contract templates
    );
}
module.exports.ApplicationForm = ApplicationForm;


/**
 * Converts property info into a JSON-like format and applies Base64 encoding
 * @param {[String]} property dictionary of property architectural details 
 * @returns {string} fixed length property URI
 */
function EncodePropertyInfo(property) {
    // formatting property info into A JSON-like form
    var propInfo = {
        "Floors": property[0], // # Floors
        "Bedrooms": property[1], // # Bedrooms
        "Bathrooms": property[2], // # Bathrooms
        "Address": property[3] // Physical address
    }

    // Applying Base64 encoding to the property data
    return propInfo.toString('base64');
}
module.exports.EncodePropertyInfo = EncodePropertyInfo;


/**
 * Produces a public key signature with user's address and Commonwealth's private key
 * @param {String} public user's public address
 * @param {String} cw commonwealth's public address
 * @returns {String} public key signature
 */
const CreateSignature = async (public, cw) => {
    // The Commonwealth performs this functionality locally to produce a certificate
    // The following encoded parameters represnt a message which certifies the user to participate in bidding
    const encoded = ethers.utils.solidityPack(["string", "address", "string"], 
    ["The Following Eth Address: ", public, " Is Certified To Participate."]);

    // Hash the encoded message through SHA / Keccak256 algorithm
    const signedCertificateMessage = web3.utils.keccak256(encoded).toString('hex');
    
    // The commonwealth performs this logic locally, through backend, to ensure 
    // that their private key is not compromised. JavaScript may be compromised 
    // as it is represented through plain text, so it is important to do this locally
    const accs = await web3.eth.getAccounts();
    const signature = await web3.eth.sign(signedCertificateMessage, accs[0]);
    
    // Verification information has been produced and can now be given to the investor to use as proof
    return signature;
}
module.exports.CreateSignature = CreateSignature;