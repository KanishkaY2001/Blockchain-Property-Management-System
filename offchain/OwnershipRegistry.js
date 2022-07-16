const mysql = require("mysql");

const db = mysql.createConnection({
    host: "blockchain-boogaloo-database.cluster-c37xdh91cqar.us-west-1.rds.amazonaws.com",
    user: "admin",
    password: "ORkbQZNVylZLkt6SnxdR",
    database: "blockchain-boogaloo"
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

export function AddNewUser(recordInfo) {
  query = 
  `INSERT INTO CertifiedUser (DateOfBirth, Email, DriversLicenceNumber, PhoneNuber, FullName)
  VALUES ('${recordInfo.dob}', '${recordInfo.email}', ${recordInfo.driversLicenceNumber}, ${recordInfo.phoneNuber}, '${recordInfo.fullName}');

  INSERT INTO EthereumWallet (Address, Balance)
  VALUES ('${recordInfo.walletAddress}', ${recordInfo.balance});

  INSERT INTO Has (DriversLicenceNumber, Address)
  VALUES (${recordInfo.driversLicenceNumber}, '${recordInfo.walletAddress}');

  INSERT INTO Property (NumBedrooms, NumBathrooms, Address, NumFloors)
  VALUES (${recordInfo.numBedrooms}, ${recordInfo.numBathrooms}, '${recordInfo.streetAddress}', ${recordInfo.numFloors});

  INSERT INTO Owns (DriversLicenceNumber, Address)
  VALUES (${recordInfo.driversLicenceNumber}, '${recordInfo.streetAddress}');`

    db.query(query, (err, results) => {
        if (err) { throw err; }
        console.log(results);
      })
}

export function RemoveRecord(DriversLicenceNumber, streetAddress) {
  query = 
  `DELETE FROM Owns WHERE DriversLicenceNumber=${DriversLicenceNumber} AND Address='${streetAddress}';`
    db.query(query, (err, results) => {
        if (err) { throw err; }
        console.log(results);
      })
}

export function ChangeOwner(previousOwnerLicenceNumber, newOwnerLicenceNumber, streetAddress) {
  query = 
  `DELETE FROM Owns WHERE DriversLicenceNumber=${previousOwnerLicenceNumber} AND Address='${streetAddress}'
  INSERT INTO Owns (DriversLicenceNumber, Address)
  VALUES (${newOwnerLicenceNumber}, '${streetAddress}');`
    db.query("SELECT * FROM `users`", (err, results) => {
        if (err) { throw err; }
        console.log(results);
      })
}

export function getPropertiesOwned(OwnerLicenceNumber, streetAddress) {
  query = 
  `SELECT * from Owns WHERE DriversLicenceNumber=${OwnerLicenceNumber} AND Address='${streetAddress}';`
    db.query("SELECT * FROM `users`", (err, results) => {
        if (err) { throw err; }
        console.log(results);
      })
}