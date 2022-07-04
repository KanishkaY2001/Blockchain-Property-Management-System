// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./PropertyAuction.sol";
import "./PropertyOracle.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/*
(Useful doc to eventually use)
key words when writing doc (RFC 2119)
“MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, 
“SHALL NOT”, “SHOULD NOT”, “RECOMMENDED”, 
“MAY”,“OPTIONAL” 
*/

contract PropertyToken is ERC721URIStorage {

    // Address of contract creator
    /*
        To Implement
    */

    // Address of oracle contract
    /*
        To Implement
    */

    // Mapping of all properties and their auctions
    /*
        To Implement
    */

    // Constructor for ERC721 contract and Property contract
    constructor() ERC721("Property", "PTY") {
        // To Implement
    }


    function DigitiseProperty(address owner) external returns(uint256) {
        // To Implement
    }


    function VerifySignature(address signer) external view returns(bool success) {
        // To Implement
    }


    function NewAuction(uint256 _start, uint256 _end, uint256 _min, uint256 _propId) external returns(PropertyAuction addr) {
        // To Implement
    }


    function TransferOwnership(uint256 _propId) external view returns(bool success) {
        // To Implement
    }
}