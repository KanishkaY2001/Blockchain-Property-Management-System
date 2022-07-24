//==============================================================================//
//                   Off-chain Amazon-AWS SQL Database Querier                  //
//==============================================================================//

//=======================================//
//    Initialize Libraries and Imports   //
//=======================================//

const mysql = require('mysql2/promise');
const databaseData = require('./sensitive.json')


//sets up a connection to the AWS Database using details stored in a different file
/**
 * Connect to the Amazon AWS database using predefined credentials
 * @returns local AWS database hook / connection
 */
async function ConnectToDatabase() {
    const connection = await mysql.createConnection({
        host: databaseData.host, // connection host
        user: databaseData.user, // user credential
        password: databaseData.password, // password credential
        database: databaseData.database // database access
    });

    // Return the created AWS connection to be used in other functions
    return connection;
}


/**
 * Adds a new user to the database. Inserts user documentation into database. 
 * Updates the details if a user already exists
 * @param {[String]} recordInfo 
 * @param {[String]} propInfo optional parameter if user has property
 */
async function AddNewUser(recordInfo, propInfo) {
    // Establish and grab the Amazon AWS database connection
    connection = await ConnectToDatabase()

    /**
     * Insert user details as a record into the database
     * Information includes:
     *     - Date of Birth
     *     - Email
     *     - Licence #
     *     - Phone #
     *     - Full name
     */
    query = // Creating a new db query
        `INSERT INTO CertifiedUser (
            DateOfBirth, 
            Email, 
            DriversLicenceNumber, 
            PhoneNuber, 
            FullName
        ) VALUES (
            '${recordInfo.dob}', 
            '${recordInfo.email}', 
            ${recordInfo.driversLicenceNumber}, 
            ${recordInfo.phoneNuber}, 
            '${recordInfo.fullName}'
        ) ON DUPLICATE KEY UPDATE 
            DateOfBirth = '${recordInfo.dob}', 
            Email = '${recordInfo.email}', 
            PhoneNuber = ${recordInfo.phoneNuber}, 
            FullName = '${recordInfo.fullName}';`

    // Send 'user details' query to database
    await connection.query(query)


    /**
     * Insert user Ethereum address as a record into the database
     * Information includes:
     *     - Ethereum Address
     */
    query =
        `INSERT INTO EthereumWallet (
            Address
        ) VALUES (
            '${recordInfo.walletAddress}'
        ) ON DUPLICATE KEY UPDATE 
            Address = '${recordInfo.walletAddress}';`

    // Send 'user Ethereum address' query to database
    await connection.query(query)


    /**
     * Insert user details as a record into the database
     * Information includes:
     *     - Licence #
     *     - Ethereum Address
     */
    query = // Creating a new db query
        `INSERT INTO Has (
        DriversLicenceNumber, 
        Address
    ) VALUES (
        ${recordInfo.driversLicenceNumber}, 
        '${recordInfo.walletAddress}'
    ) ON DUPLICATE KEY UPDATE 
        DriversLicenceNumber = ${recordInfo.driversLicenceNumber}, 
        Address = '${recordInfo.walletAddress}';`

    // Link user ethereum address and licence number 
    // Send this query to database
    await connection.query(query)

    
    // Ensure that the user has provided property information
    if (propertyInfo != false) {
        /**
         * Insert user details as a record into the database
         * Information includes:
         *     - # of bedrooms
         *     - # of bathrooms
         *     - Physical property address
         *     - # of floors
         *     - Unique Property ID
         */
        query = // Creating a new db query
            `INSERT INTO Property (
                NumBedrooms, 
                NumBathrooms, 
                Address, 
                NumFloors, 
                PropertyID
            ) VALUES (
                ${propInfo.numBedrooms}, 
                ${propInfo.numBathrooms}, 
                '${propInfo.streetAddress}', 
                ${propInfo.numFloors}, 
                ${propInfo.propertyID}
            ) ON DUPLICATE KEY UPDATE 
                NumBedrooms = ${propInfo.numBedrooms}, 
                NumBathrooms = ${propInfo.numBathrooms}, 
                Address = '${propInfo.streetAddress}', 
                NumFloors = ${propInfo.numFloors};`

        // Send 'user's property info' query to database  
        await connection.query(query)
    }
}
module.exports.AddNewUser = AddNewUser;


//Checks if a user exists in the database given a drivers licence
/**
 * Check if a user's record exists within the database
 * @param {String} OwnerLicenceNumber 
 * @returns {Bool} true if user exists, false otherwise
 */
async function checkUserExists(OwnerLicenceNumber) {
    // Establish and grab the Amazon AWS database connection
    connection = await ConnectToDatabase()

    // Querying the database to verify if the user's licence # exists within the system
    query =
        `SELECT * from CertifiedUser WHERE DriversLicenceNumber = ${OwnerLicenceNumber}`
    const [rows, fields] = await connection.query(query)

    // If their record exists, return true, otherwise false
    return rows[0] != null;
}
module.exports.checkUserExists = checkUserExists;


//Returns property info based on the the property ID given
/**
 * Get property info based on the given property ID
 * @param {String} propertyID 
 * @returns {[Object]} property information
 */
async function getPropertyInfoFromDatabase(propertyID) {
    // Establish and grab the Amazon AWS database connection
    connection = await ConnectToDatabase()

    // Querying the database to verify if the user's licence # exists within the system, and retrieving properties
    query =
        `SELECT * from Property where propertyID = ${propertyID};`
    const [rows, fields] = await connection.query(query);

    // Return the properties owned by the user, if any
    return rows;
}
module.exports.getPropertyInfoFromDatabase = getPropertyInfoFromDatabase;