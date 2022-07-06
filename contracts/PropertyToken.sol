// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./PropertyAuction.sol";
import "./PropertyOracle.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/*
(Useful doc to eventually use)
key words when writing doc (RFC 2119)
“MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, 
“SHALL NOT”, “SHOULD NOT”, “RECOMMENDED”, 
“MAY”,“OPTIONAL” 
*/

contract PropertyToken is ERC721URIStorage {

    // Address of contract creator
    address private commonwealth;

    // Address of oracle contract
    PropertyOracle private oracle;

    // Mapping of all properties and their auctions
    mapping (uint256 => PropertyAuction) public auctions;

    // Constructor for ERC721 contract and Property contract
    constructor(
        address _oracle
    ) ERC721("Property", "PTY") {
        oracle = PropertyOracle(_oracle);
        commonwealth = oracle.GetCommonwealth();
    }


    function DigitiseProperty(address owner, uint256 newItemId) external returns(uint256) {
        require(msg.sender == commonwealth, "Not Commonwealth");
        
        // mint NFT to represent property
        // GetPropertyInfo will return the base64 JSON URI
        _mint(owner, newItemId);
        _setTokenURI(newItemId, oracle.GetPropertyInfo(newItemId));
        return newItemId;
    }


    function VerifySignature(address userAddr) external view returns(bool success) {
        // verification of signature occurs....
        bytes memory signature = oracle.GetPublicSign(userAddr);

        // step 1: create signed message verification
        bytes32 signedMessageVerification = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(
                "The Following Eth Address: ",
                /// @notice To dynamically ensure that the certificate is owned by the investor calling the function
                userAddr,
                " Is Certified To Participate."
            ))
        ));

        // step 2: ensure correct format for signature:
        require(signature.length == 65, "Invalid Signature Format");
        
        // step 3: derive _publicKey from byte segments
        uint8 v;
        bytes32 r;
        bytes32 s;
        assembly {
            /// @notice After skipping the first 32 bytes of message length, value for r stored in next 32 bytes.
            r := mload(add(signature, 32))
            /// @notice Skip another 32 bytes of data length that holds r, to get the value of s
            s := mload(add(signature, 64))
            /// @notice Skip another 32 bytes of data length that holds r and s, to get the value of v
            v := byte(0, mload(add(signature, 96)))
        }

        // step 4: return true, the user is certified, can participate in bid, else cannot
        /// @notice This acts as proof that the investor a) controls the address in the certificate and b) the certificate is valid
        return commonwealth == ecrecover(signedMessageVerification, v, r, s);
    }


    function NewAuction(uint256 _start, uint256 _end, uint256 _min, uint256 _propId) external returns(PropertyAuction addr) {
        // Verify property ownership
        // Verify if property already auctioned
        // Verify provided timings make sense
        address sender = msg.sender;
        require(ownerOf(_propId) == sender, "Doesn't Own This Property");
        require(auctions[_propId].GetOwner() == address(0), "Already in Auction");
        require(_start < _end, "Bad Auction Request");

        return auctions[_propId] = new PropertyAuction(
            sender,
            _start,
            _end,
            _min,
            _propId
        );
    }


    function TransferOwnership(uint256 _propId) external returns(bool success) {
        // Get auction and property ownership information
        PropertyAuction auction = auctions[_propId];
        address currentOwner = auction.GetOwner();
        
        // Verify that auction is valid (created by this contract)
        require(msg.sender == address(auction));
        // Verify that the auction has been setup properly
        require (currentOwner != address(0), "Invalid Auction");
        
        // Check that owner owns the property listed on the auction
        if (ownerOf(_propId) == currentOwner) {
            // use ERC721 interface to call transferFrom()
            address winner = auction.GetWinner();
            transferFrom(currentOwner, winner, _propId);
            return true;
        }
    }
}