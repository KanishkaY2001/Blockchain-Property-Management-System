// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PropertyOracle {

    // Oracle Data
    address public commonwealth;
    modifier authorized() {
            require(msg.sender == commonwealth, "Not Authorized");
            _;
    }

    // User Data
    mapping (address => bytes) private publicSign; // map of all public signatures

    // Total property count
    uint256 private propertyCount;
    mapping (uint256 => string) private propertyInfo; // map of all property info (tokenURI)

    constructor(
        address _cw
    ) {
        commonwealth = _cw;
    }

    function AddPublicSign(address userAddr, bytes memory signature) authorized external {
        publicSign[userAddr] = signature;
    }

    function AddPropertyInfo(string memory encodedInfo) authorized external returns(uint256) {
        propertyInfo[++propertyCount] = encodedInfo;
        return propertyCount;
    }

    function UpdatePropertyInfo(uint256 propId, string memory encodedInfo) authorized external {
        propertyInfo[propId] = encodedInfo;
    }

    function GetPublicSign(address userAddr) external view returns(bytes memory sign) {
        return publicSign[userAddr];
    }

    function GetPropertyInfo(uint256 propertyId) external view returns(string memory info) {
        return propertyInfo[propertyId];
    }

    function GetPropertyCount() external view returns(uint256 count) {
        return propertyCount;
    }

    function GetCommonwealth() external view returns(address cw) {
        return commonwealth;
    }
}