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
//   DriversLicenceNumber: int,
//   PhoneNuber: int,
//   FullName: String,
//   walletAddress: String,
//   balance: int,
//   NumBedrooms: int,
//   NumBathrooms: int,
//   streetAddress: String,
//   NumFloors: int,
// }
export function AddNewUser(recordInfo) {
  query = 
  `INSERT INTO CertifiedUser (DateOfBirth, Email, DriversLicenceNumber, PhoneNuber, FullName)
  VALUES ('${recordInfo.dob}', '${recordInfo.email}', ${recordInfo.DriversLicenceNumber}, ${recordInfo.PhoneNuber}, '${recordInfo.FullName}');

  INSERT INTO EthereumWallet (Address, Balance)
  VALUES ('${recordInfo.walletAddress}', ${recordInfo.balance});

  INSERT INTO Has (DriversLicenceNumber, Address)
  VALUES (${recordInfo.DriversLicenceNumber}, '${recordInfo.walletAddress}');

  INSERT INTO Property (NumBedrooms, NumBathrooms, Address, NumFloors)
  VALUES (${recordInfo.NumBedrooms}, ${recordInfo.NumBathrooms}, '${recordInfo.streetAddress}', ${recordInfo.NumFloors});

  INSERT INTO Owns (DriversLicenceNumber, Address)
  VALUES (${recordInfo.DriversLicenceNumber}, '${recordInfo.streetAddress}');`

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