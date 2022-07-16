// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./PropertyToken.sol";

contract PropertyAuction {

    // Auction details 
    uint256 public startBlock;
    uint256 public endBlock;
    uint256 public minBid;

    // property seller
    PropertyToken public tokenContract;
    address public owner;
    uint256 public propertyId;

    // Bidding details
    uint256 public topBid; // top bid value
    address public topAddr; // top bidder address
    mapping (address => uint256) public bids; // map of all bids
    
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

    // Bidding function
    // update top bidder as bids are placed
    // signature - The public key signature that is given by commonwealth after certification
    function PlaceBid() external payable returns(bool success) {
        address sender = msg.sender;
        uint256 nowBlock = block.number;
        require(nowBlock > startBlock && nowBlock < endBlock, "Cannot place bid");
        require(sender != owner, "Owner cannot bid");

        // Ensures that provided signature is valid / certified
        require(tokenContract.VerifySignature(sender), "Invalid Signature");

        // If its their first bid, ensure it's > topBid, otherwise don't accept bid
        // and let them bid as usual, add new ether deposit onto old ether deposit
        uint256 value = msg.value;
        if (bids[sender] == 0) {
            require(value > topBid && value > minBid, "Bid value too low");
        }

        // Here, we're using the addition arithmetic
        // because a person should be able to place
        // multiple bids to outbid the competition.
        // Similar to Gumtree / other auction services.
        uint256 newBid = bids[sender] += msg.value;
        if (newBid > topBid) {
            topBid = newBid;
            topAddr = sender;
        }
        return true;
    }

    // Property Claiming function
    // simply check if top[msg.sender] != 0
    function ClaimProperty() external returns(bool success) {
        require(block.number > endBlock, "Auction has not ended");
        require(msg.sender == topAddr || msg.sender == owner, "Not Authorized");
        if (topBid != 0) {
            // ensure that claimAsset can't be called multiple times
            topBid = 0;
            return tokenContract.TransferOwnership(propertyId);
        }
    }

    // all unusccessful bidders can claim their ether back at anytime
    function ClaimDeposit() external returns(bool success) {
        address sender = msg.sender;
        uint256 deposit = bids[sender];

        // Ensure that the caller is actually a bidder
        // Also ensure that the caller isn't the auction winner
        if (deposit != 0 && sender != topAddr) {
            bids[sender] = 0; // change to 0 immediately

            (bool sent, ) = payable(sender).call{value: deposit}("");
            require(sent, "Failed to send Ether");
            return true;
        }
    }
    
    // We need an 'external' function to allow factory contract
    // to retrieve the address of the winner, to set new owner
    function GetWinner() external view returns(address addr) {
        return topAddr;
    }

    // We need an 'external' function to allow factory contract
    // to verify that the auction was created by factory, and not 3rd party
    function GetOwner() external view returns(address addr) {
        return owner;
    }
}