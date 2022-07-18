const mysql = require("mysql");

const db = mysql.createConnection({
    host: "blockchain-boogaloo-database.cluster-c37xdh91cqar.us-west-1.rds.amazonaws.com",
    user: "admin",
    password: "ORkbQZNVylZLkt6SnxdR",
    database: "CertifiedUsers"
  });
  db.connect((err) => {
    if (err) { throw err; }
    console.log("DB connection OK");
  });

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

function AddNewUser(recordInfo) {
  query = 
  `INSERT INTO CertifiedUser (DateOfBirth, Email, DriversLicenceNumber, PhoneNuber, FullName) VALUES ('${recordInfo.dob}', '${recordInfo.email}', ${recordInfo.driversLicenceNumber}, ${recordInfo.phoneNuber}, '${recordInfo.fullName}')
  ON DUPLICATE KEY UPDATE DateOfBirth = '${recordInfo.dob}', Email = '${recordInfo.email}', PhoneNuber = ${recordInfo.phoneNuber}, FullName = '${recordInfo.fullName}';`

  db.query(query, (err, results) => {
      if (err) { throw err; }
  })

  query = 
  `INSERT INTO EthereumWallet (Address, Balance) VALUES ('${recordInfo.walletAddress}', ${recordInfo.balance})
  ON DUPLICATE KEY UPDATE Address = '${recordInfo.walletAddress}', Balance = ${recordInfo.balance};`

  db.query(query, (err, results) => {
      if (err) { throw err; }
  })

  query = 
  `INSERT INTO Has (DriversLicenceNumber, Address) VALUES (${recordInfo.driversLicenceNumber}, '${recordInfo.walletAddress}')
  ON DUPLICATE KEY UPDATE DriversLicenceNumber = ${recordInfo.driversLicenceNumber}, Address = '${recordInfo.walletAddress}';`

  db.query(query, (err, results) => {
      if (err) { throw err; }
  })

  query = 
  `INSERT INTO Property (NumBedrooms, NumBathrooms, Address, NumFloors, PropertyID) VALUES (${recordInfo.numBedrooms}, ${recordInfo.numBathrooms}, '${recordInfo.streetAddress}', ${recordInfo.numFloors}, ${recordInfo.propertyID}) 
  ON DUPLICATE KEY UPDATE NumBedrooms = ${recordInfo.numBedrooms}, NumBathrooms = ${recordInfo.numBathrooms}, Address = '${recordInfo.streetAddress}', NumFloors = ${recordInfo.numFloors};`

  db.query(query, (err, results) => {
      if (err) { throw err; }
  })

  query = 
  `INSERT INTO Owns (DriversLicenceNumber, PropertyID) VALUES (${recordInfo.driversLicenceNumber}, '${recordInfo.propertyID}')
  ON DUPLICATE KEY UPDATE DriversLicenceNumber = ${recordInfo.driversLicenceNumber}, PropertyID = '${recordInfo.propertyID}';`

  db.query(query, (err, results) => {
      if (err) { throw err; }
  })
}
module.exports.AddNewUser = AddNewUser;

function RemoveRecord(DriversLicenceNumber, streetAddress) {
  query = 
  `DELETE FROM Owns WHERE DriversLicenceNumber=${DriversLicenceNumber} AND Address='${streetAddress}';`
    db.query(query, (err, results) => {
        if (err) { throw err; }
      })
}
module.exports.RemoveRecord = RemoveRecord;

function ChangeOwner(previousOwnerLicenceNumber, newOwnerLicenceNumber, streetAddress) {
  query = 
  `DELETE FROM Owns WHERE DriversLicenceNumber=${previousOwnerLicenceNumber} AND Address='${streetAddress}'
  INSERT INTO Owns (DriversLicenceNumber, Address)
  VALUES (${newOwnerLicenceNumber}, '${streetAddress}');`
    db.query(query, (err, results) => {
        if (err) { throw err; }
      })
}
module.exports.ChangeOwner = ChangeOwner;

function getPropertiesOwned(OwnerLicenceNumber, streetAddress) {
  query = 
  `SELECT * from Owns WHERE DriversLicenceNumber=${OwnerLicenceNumber} AND Address='${streetAddress}';`
    db.query(query, (err, results) => {
        if (err) { throw err; }
      })
}
module.exports.getPropertiesOwned = getPropertiesOwned;

function checkUserExists(OwnerLicenceNumber) {
  found = true;
  query = 
  `SELECT * from CertifiedUser WHERE DriversLicenceNumber=${OwnerLicenceNumber};`
    db.query(query, (err, results) => {
        if (err) { throw err; }
        //in reality should check the results, but not too essential for the scope to fully implement
        found = results.length > 1;
      })
  return false;
}
module.exports.checkUserExists = checkUserExists;

function getOwnedProperty(ethAddr, callback, driversLicenceNumber) {
  returnVal = ""
  query = 
  `SELECT * from Property where propertyID = (Select propertyID from Owns where DriversLicenceNumber = ${driversLicenceNumber})`
    db.query(query, (err, results) => {driversLicenceNumber
        if (err) { throw err; }
        callback(ethAddr, results);
      })
  return returnVal;
}
module.exports.getOwnedProperty = getOwnedProperty;