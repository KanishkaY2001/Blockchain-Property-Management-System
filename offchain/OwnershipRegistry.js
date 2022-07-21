const mysql = require('mysql2/promise');

//Adds a new user along with their eth wallet and property
//recordInfo = {
//   dob: String,
//   email: String,
//   driversLicenceNumber: int,
//   phoneNuber: int,
//   fullName: String,
//   walletAddress: String,
//   balance: int,
//   numBedrooms: int,
//   numBathrooms: int,
//   streetAddress: String,
//   numFloors: int,
// }

async function AddNewUser(recordInfo, propInfo) {
  const connection = await mysql.createConnection({
    host: "blockchain-boogaloo-database.cluster-c37xdh91cqar.us-west-1.rds.amazonaws.com",
    user: "admin",
    password: "ORkbQZNVylZLkt6SnxdR",
    database: "CertifiedUsers"
  });

  query = 
  `INSERT INTO CertifiedUser (DateOfBirth, Email, DriversLicenceNumber, PhoneNuber, FullName) VALUES ('${recordInfo.dob}', '${recordInfo.email}', ${recordInfo.driversLicenceNumber}, ${recordInfo.phoneNuber}, '${recordInfo.fullName}')
  ON DUPLICATE KEY UPDATE DateOfBirth = '${recordInfo.dob}', Email = '${recordInfo.email}', PhoneNuber = ${recordInfo.phoneNuber}, FullName = '${recordInfo.fullName}';`

  await connection.query(query)

  query = 
  `INSERT INTO EthereumWallet (Address, Balance) VALUES ('${recordInfo.walletAddress}', ${recordInfo.balance})
  ON DUPLICATE KEY UPDATE Address = '${recordInfo.walletAddress}', Balance = ${recordInfo.balance};`

  await connection.query(query)

  if (propertyInfo != false) {
    query = 
    `INSERT INTO Has (DriversLicenceNumber, Address) VALUES (${recordInfo.driversLicenceNumber}, '${recordInfo.walletAddress}')
    ON DUPLICATE KEY UPDATE DriversLicenceNumber = ${recordInfo.driversLicenceNumber}, Address = '${recordInfo.walletAddress}';`

    await connection.query(query)

    query = 
    `INSERT INTO Property (NumBedrooms, NumBathrooms, Address, NumFloors, PropertyID) VALUES (${propInfo.numBedrooms}, ${propInfo.numBathrooms}, '${propInfo.streetAddress}', ${propInfo.numFloors}, ${propInfo.propertyID}) 
    ON DUPLICATE KEY UPDATE NumBedrooms = ${propInfo.numBedrooms}, NumBathrooms = ${propInfo.numBathrooms}, Address = '${propInfo.streetAddress}', NumFloors = ${propInfo.numFloors};`

    await connection.query(query)

    query = 
    `INSERT INTO Owns (DriversLicenceNumber, PropertyID) VALUES (${recordInfo.driversLicenceNumber}, '${propInfo.propertyID}')
    ON DUPLICATE KEY UPDATE DriversLicenceNumber = ${recordInfo.driversLicenceNumber}, PropertyID = '${propInfo.propertyID}';`

    await connection.query(query)
  }
}
module.exports.AddNewUser = AddNewUser;

async function checkUserExists(OwnerLicenceNumber) {
  const connection = await mysql.createConnection({
    host: "blockchain-boogaloo-database.cluster-c37xdh91cqar.us-west-1.rds.amazonaws.com",
    user: "admin",
    password: "ORkbQZNVylZLkt6SnxdR",
    database: "CertifiedUsers"
  });
  query = 
  `SELECT * from CertifiedUser WHERE DriversLicenceNumber = ${OwnerLicenceNumber}`
  const [rows, fields] = await connection.query(query)
  return rows[0] != null;
}
module.exports.checkUserExists = checkUserExists;

async function getOwnedProperty(driversLicenceNumber) {
  const connection = await mysql.createConnection({
    host: "blockchain-boogaloo-database.cluster-c37xdh91cqar.us-west-1.rds.amazonaws.com",
    user: "admin",
    password: "ORkbQZNVylZLkt6SnxdR",
    database: "CertifiedUsers"
  });
  query = 
  `SELECT * from Property where propertyID = (Select propertyID from Owns where DriversLicenceNumber = ${driversLicenceNumber})`
  const [rows, fields] = await connection.query(query);
  return rows;
}
module.exports.getOwnedProperty = getOwnedProperty;