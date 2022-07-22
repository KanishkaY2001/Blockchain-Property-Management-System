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
        commonwealth = msg.sender;
    }

    // Overriding the transfer func to ensure that properties may only be traded through an auction
    // OR checking if recipient is the auction contract, to transfer NFT to auction contract
    function _transfer(address sender, address recipient, uint256 tokenId) internal virtual override {
        address auctAddr = address(auctions[tokenId]);
        require(auctAddr == sender || auctAddr == recipient, "Unauthorized");
        super._transfer(sender, recipient, tokenId);
    }

    function DigitiseProperty(address owner, uint256 newItemId) external {
        require(msg.sender == commonwealth, "Not Commonwealth");

        // mint NFT to represent property
        // GetPropertyInfo will return the base64 JSON URI
        _mint(owner, newItemId);
        _setTokenURI(newItemId, oracle.GetPropertyInfo(newItemId));
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


    function NewAuction(uint256 _start, uint256 _end, uint256 _min, uint256 _propId) external returns(address addr) {
        
        address sender = msg.sender;
        //PropertyAuction auc = auctions[_propId];

        // First time auction or property already auctioned, hence need two || checks
        //require(address(auc) == address(0) || auc.GSetOwner(false) == address(0), "Already in Auction");
        require(ownerOf(_propId) == sender, "Doesn't Own This Property"); // Verify property ownership
        require(_start < _end, "Bad Auction Request"); // Verify provided timings make sense

        auctions[_propId] = new PropertyAuction(
            sender,
            _start,
            _end,
            _min,
            _propId
        );

        require(_start + _end + _min + _propId > 0, "DAWD");
        address auctionAddr = address(auctions[_propId]);
        transferFrom(sender, auctionAddr, _propId);
        return auctionAddr;
    }


    function TransferOwnership(uint256 _propId, bool sold) external returns(bool success) {
        // Get auction and property ownership information
        PropertyAuction auction = auctions[_propId];
        address auctionAddr = address(auction);
        
        // Verify that auction is valid (created by this contract)
        require(msg.sender == auctionAddr);
        
        // Check that owner owns the property listed on the auction
        if (ownerOf(_propId) == auctionAddr) {
            
            // Basically removes propId -> auction mapping by setting owner to address(0)
            // This is because NewAuction function checks if owner is address(0).
            // And this line will make it address(0) after the auction ends. Property can't have
            // multiple auctions at once, and allows x number of auctions over time
            address newOwner = sold? auction.GetWinner() : auctions[_propId].GSetOwner(true);

            // use ERC721 interface to call transferFrom()
            // Transfer to winner if sold, otherwise back to previous owner
            transferFrom(auctionAddr, newOwner, _propId);
            return true;
        }
    }
}