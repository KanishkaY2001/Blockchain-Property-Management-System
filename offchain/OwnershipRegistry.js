const mysql = require('mysql2/promise');
const databaseData = require('./sensitive.json')

//sets up a connection to the AWS Database using details stored in a different file
async function ConnectToDatabase() {
    const connection = await mysql.createConnection({
        host: databaseData.host,
        user: databaseData.user,
        password: databaseData.password,
        database: databaseData.database
    });
    return connection;
}

//Adds a new user to the database. New users might not necessarily have property they own so propInfo is an optional parameter.
//Inserts the users identification documents in to the database and updates the details if the user already exists.
async function AddNewUser(recordInfo, propInfo) {
    connection = await ConnectToDatabase()
    query =
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

    await connection.query(query)

    query =
        `INSERT INTO EthereumWallet (
            Address, 
            Balance
        ) VALUES (
            '${recordInfo.walletAddress}', 
            ${recordInfo.balance}
        ) ON DUPLICATE KEY UPDATE 
            Address = '${recordInfo.walletAddress}', 
            Balance = ${recordInfo.balance};`

    await connection.query(query)

    //If the user has property they already own, add this to the database too
    if (propertyInfo != false) {
        query =
            `INSERT INTO Has (
                DriversLicenceNumber, 
                Address
            ) VALUES (
                ${recordInfo.driversLicenceNumber}, 
                '${recordInfo.walletAddress}'
            ) ON DUPLICATE KEY UPDATE 
                DriversLicenceNumber = ${recordInfo.driversLicenceNumber}, 
                Address = '${recordInfo.walletAddress}';`

        await connection.query(query)

        query =
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

        await connection.query(query)

        query =
           `INSERT INTO Owns (
                DriversLicenceNumber, 
                PropertyID
            ) VALUES (
                ${recordInfo.driversLicenceNumber}, 
                ${propInfo.propertyID}
            ) ON DUPLICATE KEY UPDATE 
                DriversLicenceNumber = ${recordInfo.driversLicenceNumber}, 
                PropertyID = ${propInfo.propertyID};`

        await connection.query(query)
    }
}
module.exports.AddNewUser = AddNewUser;

//Checks if a user exists in the database given a drivers licence
async function checkUserExists(OwnerLicenceNumber) {
    connection = await ConnectToDatabase()
    query =
        `SELECT * from CertifiedUser WHERE DriversLicenceNumber = ${OwnerLicenceNumber}`
    const [rows, fields] = await connection.query(query)
    return rows[0] != null;
}
module.exports.checkUserExists = checkUserExists;

//Returns a list of properties that a user owns
async function getOwnedProperty(driversLicenceNumber) {
    connection = await ConnectToDatabase()
    query =
        `SELECT * from Property where propertyID = (Select propertyID from Owns where DriversLicenceNumber = ${driversLicenceNumber})`
    const [rows, fields] = await connection.query(query);
    return rows;
}
module.exports.getOwnedProperty = getOwnedProperty;