// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


//==============================================================================//
//                          Property Auction Contract                           //
//==============================================================================//

//===========================================================//
//                 External Contract Imports                 //
//===========================================================//


import "./PropertyToken.sol";


/// @title Handler contract which controls the auction bidding process
/// @author Commonwealth - NSW Government (PropertyToken factory contract)
/// @notice Handles interactions from certified parties based on predefined rules
/// @dev Deposit collection and distribution is handled by this child contract
contract PropertyAuction {

    //===========================================================//
    //               Auction Variables and Mappings              //
    //===========================================================//


    // Describes the start and end of the auction, based on network block number
    uint256 private startBlock;
    uint256 private endBlock;
    
    // Restricts bidding value to remain above the minimum specified amount
    uint256 private minBid;

    // Stores a record of the parent (factory) token contract to make calls
    PropertyToken private tokenContract;

    // Describes the owner's public address and the Id of the property they have auctioned
    address private owner;
    uint256 private propertyId;

    // Represents the current highest bidder's bid value and public address
    uint256 private topBid;
    address private topAddr;

    // A mapping of user addresses to their total bid value, represented as Wei
    mapping (address => uint256) private bids;


    //===========================================================//
    //                    Contract Constructor                   //
    //===========================================================//


    /// @notice Sets auction details, including seller's rules and stores the factory contract
    /// @dev Once the rules are set, during contract creation, they may not be change
    /// @param _owner - This is the current property owner's public address
    /// @param _startBlock - An auction rule describing the start block number
    /// @param _endBlock - An auction rule describing the end block number
    /// @param _minBid - An auction rule which restricts minimum bid value
    /// @param _prop - The unique property NFT Id for which this auction is being conducted for
    constructor(
        address _owner, 
        uint256 _startBlock, 
        uint256 _endBlock, 
        uint256 _minBid,
        uint256 _prop
    ) {
        owner = _owner;
        startBlock = _startBlock;
        endBlock = _endBlock;
        minBid = _minBid;
        propertyId = _prop;
        tokenContract = PropertyToken(msg.sender);
    }


    //===========================================================//
    //               Auction Bidding Functionality               //
    //===========================================================//


    /// @notice Enables certified users to place bids to purchase the property, by providing ether
    /// @dev Any user is eligible to bid in any auction, however they must be certified
    /// @return success - Provided that execution is successful (without reverts) expect 'True'
    function PlaceBid() external payable returns(bool success) {
        address sender = msg.sender;
        uint256 nowBlock = block.number;

        // Ensure that a bid is made within the bounds of the provided auction block numbers
        require(nowBlock > startBlock && nowBlock < endBlock, "Cannot place bid");

        // Ensure that the caller is not the owner, as the owner cannot bid on their own property
        require(sender != owner, "Owner cannot bid");

        // Ensures that provided user's public address is valid / certified
        require(tokenContract.VerifySignature(sender), "Invalid Signature");

        // If its their first bid, ensure it's > topBid, otherwise don't accept bid
        // and let them bid as usual, add new ether deposit onto old ether deposit
        uint256 value = msg.value;
        if (bids[sender] == 0) {
            require(value > topBid && value > minBid, "Bid value too low");
        }

        // Here, we're using the addition arithmetic because a person should be able to place
        // multiple bids to outbid the competition. Similar to Gumtree / other auction services.
        uint256 newBid = bids[sender] += msg.value;
        if (newBid > topBid) {
            topBid = newBid;
            topAddr = sender;
        }
        return true;
    }


    //===========================================================//
    //              Asset Acquisition Functionality              //
    //===========================================================//


    /// @notice Allows the auction winner, or if unsold, the owner, to re/claim the property NFT
    /// @dev This functionality may only execute successfully after the auction ends
    /// @return  success - Provided that execution is successful (without reverts) expect 'True'
    function ClaimProperty() external returns(bool success) {

        // Ensure that the auction has ended
        require(block.number > endBlock, "Auction has not ended");

        // Ensure that the caller is either the winner or the owner
        require(msg.sender == topAddr || msg.sender == owner, "Not Authorized");

        // If property is not sold, owner gets property back
        bool soldStatus = false;

        // Follow checks-effects-interaction and prevents re-entrancy
        // ensure that ClaimProperty can't be called multiple times
        if (topBid != 0) {
            // Immediately set top bid to zero
            topBid = 0;

            // Signifies that the property was sold
            soldStatus = true;
        }

        // Create delegate call to transfer NFT ownership from factory contract
        return tokenContract.TransferOwnership(propertyId, soldStatus);
    }


    /// @notice Allows the property seller and less competitive bidders to re/claim deposit
    /// @dev Less competitive bidders may claim their ether deposit back at anytime
    /// @return success - If the user is eligible for deposit claim, True, False otherwise
    function ClaimDeposit() external returns(bool success) {
        address sender = msg.sender;
        uint256 deposit = bids[sender];
        uint256 topDepo = bids[topAddr];

        // Initially disallow deposit claimability, until verified
        bool canClaim = false;

        // User's deposit cannot be zero (meaning they have not bid or already refunded)
        // The top paying bidder is unable to refund their deposit, as they are the current winner
        // Follow checks-effects-interaction and prevents re-entrancy
        if (deposit != 0 && sender != topAddr) {
            // Immediately set top bid to zero
            bids[sender] = 0;

            // Signifies that the user is eligible for deposit claim
            canClaim = true;

        // Owner's deposit cannot be zero (meaning nobody placed a bid or already refunded)
        // The owner will collect the top bidder's deposit, once the auction has concluded
        // Follow checks-effects-interaction and prevents re-entrancy
        } else if (sender == owner && block.number > endBlock && bids[topAddr] != 0) {
            // Immediately set top bid to zero
            bids[topAddr] = 0;

            // Signifies that the user is eligible for deposit claim
            // Set the deposit value to the top bidder's deposit
            deposit = topDepo;
            canClaim = true;
        }

        // Ensure that the user is eligible for a deposit claim
        if (!canClaim) return false;

        // Send the deposit owed to the respective auction participant
        (bool sent, ) = payable(sender).call{value: deposit}("");
        require(sent, "Failed to send Ether");
        return true;
    }
    

    //===========================================================//
    //                    Data Getter Utilities                  //
    //===========================================================//


    /// @notice Allows external sources to get the current top bidder's public address
    /// @dev This value may likely change, over time, as users outbid eachother
    /// @return addr - The current top bidder's public address
    function GetWinner() external view returns(address addr) {
        return topAddr;
    }


    /// @notice Allows external sources to get, or set, the auctioning property's owner address
    /// @dev The address may only be set to the zero address, to signify a nullified contract
    /// @dev Setting is additionally restricted to Commonwealth, while any party may call get
    /// @param set - Determines whether the calling party wishes to set the owner's address
    /// @return addr - The property owner's public address
    function GSetOwner(bool set) external returns(address addr) {
        // need this, because the value may change, in which case, the function
        // needs to return the previous value of owner (before setting to address(0))
        address _owner = owner;
        if (set) {
            // Making sure that owner can only be set by token contract
            require(msg.sender == address(tokenContract), "Not Authorized");

            // Sets the owner to zero address to signify a nullified auction contract
            owner = address(0);
        }
        return _owner;
    }
}