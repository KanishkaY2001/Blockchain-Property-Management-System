// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PropertyOracle {

    // Oracle Data
    address public commonwealth;
    /*
        To Implement
    */

    // Total property count
    /*
        To Implement
    */

    constructor(
        address _cw
    ) {
        commonwealth = _cw;
    }

    function AddPublicSignature(address signer, bytes memory signature) external returns(bool success) {
        // To Implement
    }

    function AddPropertyInfo(string memory encodedInfo) external returns(bool success) {
        // To Implement
    }

    function GetPublicSign(address signer) external view returns(bytes memory sign) {
        // To Implement
    }

    function GetPropertyInfo(uint256 propertyId) external view returns(string memory info) {
        // To Implement
    }

    function GetPropertyCount() external view returns(uint256 count) {
        // To Implement
    }

    function GetCommonwealth() external view returns(address cw) {
        // To Implement
    }
}