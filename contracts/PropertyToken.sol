// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


//==============================================================================//
//                           Property Token Contract                            //
//==============================================================================//

//===========================================================//
//                 External Contract Imports                 //
//===========================================================//


import "./PropertyAuction.sol";
import "./PropertyOracle.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


/// @title Factory property token contract which stores and controls properties
/// @author Commonwealth - NSW Government
/// @notice Contract is responsible for token ownership, transferral and storage
/// @dev Employs an extended ERC721 interface and provides a restricted _transfer method
contract PropertyToken is ERC721URIStorage {

    //===========================================================//
    //                Token Variables and Mappings               //
    //===========================================================//


    // An address which represents the official Commonwealth public address
    address private commonwealth;

    // Stores a record of the property oracle contract to make verification calls
    PropertyOracle private oracle;

    // A mapping of unique property Id to the property auction they belong to, if any
    mapping (uint256 => PropertyAuction) public auctions;


    //===========================================================//
    //                    Contract Constructor                   //
    //===========================================================//


    // Constructor for ERC721 contract and Property contract
    /// @notice Sets Commonwealth's official public address during contract creation
    /// @dev It is important to deploy the oracle contract prior to this
    /// @param _oracle - An address which represents the officially deployed Oracle contract
    constructor(
        address _oracle
    ) ERC721("Property", "PTY") {
        oracle = PropertyOracle(_oracle);
        commonwealth = msg.sender;
    }


    //===========================================================//
    //                Certified User Verification                //
    //===========================================================//


    /// @notice Verifies the provided Ethereum public address to ensure user is certified
    /// @dev Checks whether the address exists in the set of public key signatures, provided by oracle
    /// @param userAddr - Represents the user's public address
    /// @return success - If the address exists within the set of signatures, True, False otherwise
    function VerifySignature(address userAddr) external view returns(bool success) {

        // verification of signature occurs
        // Calls oracle to get the public key signature stored for the given address, if any
        bytes memory signature = oracle.GetPublicSign(userAddr);

        // step 1: Create signed message verification
        bytes32 signedMessageVerification = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(
                "The Following Eth Address: ",
                // Dynamically ensure that the signature is owned by the user calling the function
                userAddr,
                " Is Certified To Participate."
            ))
        ));

        // step 2: Ensure correct format for signature by checking length
        require(signature.length == 65, "Invalid Signature Format");
        
        // step 3: Derive public key from byte segments
        uint8 v;
        bytes32 r;
        bytes32 s;
        assembly {
            // After skipping the first 32 bytes of message length, value for r stored in next 32 bytes.
            r := mload(add(signature, 32))
            // Skip another 32 bytes of data length that holds r, to get the value of s
            s := mload(add(signature, 64))
            // Skip another 32 bytes of data length that holds r and s, to get the value of v
            v := byte(0, mload(add(signature, 96)))
        }

        // step 4: Return True if the user is certified, can participate in bidding, otherwise cannot
        // This acts as proof that the user controls the address in the provided signature, from oracle
        return commonwealth == ecrecover(signedMessageVerification, v, r, s);
    }


    //===========================================================//
    //             Property NFT Auction Functionality            //
    //===========================================================//


    /// @notice Essentially converts the owner's physical property into a digital NFT
    /// @dev Property NFT is transferred to the property owner's public address
    /// @param owner - Represents the physical property owner's public address
    /// @param newItemId - The incremental and unique property Id to set the NFT Id to
    function DigitiseProperty(address owner, uint256 newItemId) external {

        // Ensure that the function is only accessible by Commonwealth address
        require(msg.sender == commonwealth, "Not Commonwealth");

        // mint NFT to represent property using the given token Id
        _mint(owner, newItemId);

        // Set token URI to Base64 encoded JSON, grabbed from property oracle
        _setTokenURI(newItemId, oracle.GetPropertyInfo(newItemId));
    }


    /// @notice Enables a property owner to create a new auction, given a set of rules, using a factory pattern
    /// @dev The cost of deploying the auction contract itself is tanked by the owner
    /// @param start - An auction rule describing the start block number
    /// @param end - An auction rule describing the end block number
    /// @param min - An auction rule which restricts minimum bid value
    /// @param propId - The unique property NFT Id for which this auction is being conducted for
    /// @return addr - The Ethereum address of the newly created property auction
    function NewAuction(uint256 start, uint256 end, uint256 min, uint256 propId) external returns(address addr) {
        address sender = msg.sender;

        // Represents the currently active auction, for the property, if any
        PropertyAuction auc = auctions[propId];

        // First time auction for property or property already auctioned before, hence need two || checks
        require(address(auc) == address(0) || auc.GSetOwner(false) == address(0), "Already in Auction");

        // Verify that the property is owned by the function caller
        require(ownerOf(propId) == sender, "Doesn't Own This Property");

        // Ensure that the rules provided to the auction are appropriate
        require(start < end, "Bad Auction Request");

        // Create a new auction contract through the factory pattern, using the given rules
        auctions[propId] = new PropertyAuction(
            sender, // Property owner's address
            start, // Start block of the auction
            end, // End block of the auction
            min, // Minimum possible bid value
            propId // Unique property NFT Id
        );
        address auctionAddr = address(auctions[propId]);

        // Transfer the property from the owner to the auction contract to 'lock' it
        // This ensures that the property may not be tampered with during the auction process
        transferFrom(sender, auctionAddr, propId);
        return auctionAddr;
    }


    //===========================================================//
    //              Property Transfer Functionality              //
    //===========================================================//


    /// @notice Overriding the transfer function to ensure that properties may only be traded through an auction
    /// @dev Alternatively, checking if recipient is the auction contract, to transfer NFT to auction contract
    /// @param sender - An address which represents the 'from' field within the transfer function
    /// @param recipient - An address which represents the 'to' field within the transfer function
    /// @param tokenId - The unique property Id that represents the NFT to be transferred
    function _transfer(address sender, address recipient, uint256 tokenId) internal virtual override {
        address auctAddr = address(auctions[tokenId]);
        require(auctAddr == sender || auctAddr == recipient, "Unauthorized");
        super._transfer(sender, recipient, tokenId);
    }


    /// @notice Enables property token ownership transferral from the auction contract to the winner
    /// @dev If the property is not sold, the property is sent from auction contract back to the owner
    /// @param propId - The unique property id that represents the NFT being transferred
    /// @param sold - Determines whether the property was actually sold or not
    /// @return success - If transferral was successful, True, False otherwise
    function TransferOwnership(uint256 propId, bool sold) external returns(bool success) {

        // Get auction and property ownership information
        PropertyAuction auction = auctions[propId];
        address auctionAddr = address(auction);
        
        // Verify that auction is valid (created by this contract)
        require(msg.sender == auctionAddr);
        
        // Check that owner owns the property listed on the auction
        if (ownerOf(propId) == auctionAddr) {
            
            // Basically removes propId -> auction mapping by setting owner to address(0)
            // This is because NewAuction function checks if owner is address(0).
            // And this line will make it address(0) after the auction ends. Property can't have
            // multiple auctions at once. This also allows x number of auctions over time
            address newOwner = sold? auction.GetWinner() : auctions[propId].GSetOwner(true);

            // use ERC721 interface to call transferFrom()
            // Transfer to winner if sold, otherwise back to previous owner
            transferFrom(auctionAddr, newOwner, propId);
            return true;
        }
    }
}