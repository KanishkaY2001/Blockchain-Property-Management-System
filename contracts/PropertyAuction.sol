// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./PropertyToken.sol";

contract PropertyAuction {

    // Auction details 
    uint256 private startBlock;
    uint256 private endBlock;
    uint256 private minBid;

    // property seller
    PropertyToken private tokenContract;
    address private owner;
    uint256 private propertyId;

    // Bidding details
    uint256 private topBid; // top bid value
    address private topAddr; // top bidder address
    mapping (address => uint256) private bids; // map of all bids

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
        require(nowBlock >= startBlock && nowBlock < endBlock, "Cannot place bid");
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
        bool soldStatus = false; // If not sold, owner gets property back
        if (topBid != 0) {
            // ensure that claimAsset can't be called multiple times
            topBid = 0;
            soldStatus = true; // If sold, winner gets property
        }
        return tokenContract.TransferOwnership(propertyId, soldStatus);
    }

    // all unusccessful bidders can claim their ether back at anytime
    function ClaimDeposit() external returns(bool success) {
        address sender = msg.sender;
        uint256 deposit = bids[sender];
        uint256 topDepo = bids[topAddr];
        bool canClaim = false;


        // doc: owner's deposit will always be 0 (can't bid)
        // doc: random people/winner can't satisfy this if-else-if
        if (deposit != 0 && sender != topAddr) {
            bids[sender] = 0; // change to 0 immediately
            canClaim = true;

        // doc: only owner can access else-if statement
        // doc: can only access it once, and can claim deposit
        } else if (sender == owner && block.number > endBlock && bids[topAddr] != 0) {
            bids[topAddr] = 0;
            deposit = topDepo;
            canClaim = true;
        }

        // doc: if the if-else-if statement isn't accessed, false
        if (!canClaim) return false;

        // doc: send the deposit owed to the respective auction participant
        (bool sent, ) = payable(sender).call{value: deposit}("");
        require(sent, "Failed to send Ether");
        return true;
    }
    
    // We need an 'external' function to allow factory contract
    // to retrieve the address of the winner, to set new owner
    function GetWinner() external view returns(address addr) {
        return topAddr;
    }

    // We need an 'external' function to allow factory contract
    // to verify that the auction was created by factory, and not 3rd party
    // GSET = Get / Set. Pass True to set, Pass False to get without setting
    function GSetOwner(bool set) external returns(address addr) {
        // need this, because the value may change, in which case, the function
        // needs to return the previous value of owner (before setting to address(0))
        address _owner = owner;
        if (set) {
            // Making sure that owner can only be set by token contract
            require(msg.sender == address(tokenContract), "Not Authorized");
            owner = address(0);
        }
        return _owner;
    }
}