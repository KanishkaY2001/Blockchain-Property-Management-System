// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


//==============================================================================//
//                          Property Oracle Contract                            //
//==============================================================================//


/// @title Centralized oracle to store offchain user and property data
/// @author Commonwealth - NSW Government
/// @notice Oracle stores injected data and enables official data verificataion
/// @dev Public key signature and Property URI are stored within the private mappings
contract PropertyOracle {

    //===========================================================//
    //               Oracle Variables and Mappings               //
    //===========================================================//


    // A mapping of user addresses to their public key signatures, stored once certified
    mapping (address => bytes) private publicSign;

    // Representation of total recorded properties, and also signifies the latest propertyId
    uint256 private propertyCount;

    // A mapping of unique property ID to its architectural info, encoded using Base64
    mapping (uint256 => string) private propertyInfo;

    // An address which represents the official Commonwealth public address
    address public commonwealth;


    //===========================================================//
    //                     Function Modifiers                    //
    //===========================================================//


    /// @notice Ensures that malicious calls may not be made to functions which require authorized access
    /// @dev Such functions are callable only through the Commonwealth address
    modifier authorized() {
        require(msg.sender == commonwealth, "Not Authorized");
        _;
    }

    
    //===========================================================//
    //                    Contract Constructor                   //
    //===========================================================//


    /// @notice Sets Commonwealth's official public address during contract creation
    /// @dev This value is designed to remain constant, as Commonwealth is a single entity
    constructor() {
        commonwealth = msg.sender;
    }


    //===========================================================//
    //                    Data Adder Utilities                   //
    //===========================================================//


    /// @notice Allows offchain logic to inject a user's public key signature to be stored onchain
    /// @dev May only be called by Commonwealth and multiple calls will replace existing signature
    /// @param userAddr - This is the user's address
    /// @param signature - User's newly generated public key signature, to store
    function AddPublicSign(address userAddr, bytes memory signature) authorized external {
        publicSign[userAddr] = signature; // sets the user's address mapping to signature
    }


    /// @notice Allows offchain logic to inject property URI info to be stored onchain
    /// @dev May only be called by Commonwealth, calls will replace existing signature
    /// @dev propId is incremental and will experience no unintentional assignment
    /// @param propId - The unique property Id, used to represent the NFT's Id
    /// @param encodedInfo - JSON property info encoded using Base64
    /// @return count - A count of the total recorded properties
    function AddPropertyInfo(uint256 propId, string memory encodedInfo) 
                             authorized external returns(uint256 count) {
        propertyInfo[propId] = encodedInfo;
        return propertyCount;
    }


    //===========================================================//
    //                    Data Getter Utilities                  //
    //===========================================================//


    /// @notice Allows external sources to get a user's public key signature, given their address
    /// @dev Due to asymmetric key encryption, this info will not threaten the security of the system
    /// @param userAddr - This is the user's address, a required field as Commonwealth will call this function
    /// @return sign - This represents the user's public key signature, provided the user is certified
    function GetPublicSign(address userAddr) external view returns(bytes memory sign) {
        return publicSign[userAddr];
    }


    /// @notice Allows external sources to get a property's info URI, given its unique Id
    /// @dev The value is a fixed length string which aids in storage efficiency
    /// @param propId - The incremental and unique property Id, used to represent the NFT's Id
    /// @return info - JSON property architectural info encoded using Base64 (fixed length string)
    function GetPropertyInfo(uint256 propId) external view returns(string memory info) {
        return propertyInfo[propId];
    }
}