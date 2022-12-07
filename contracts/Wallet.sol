pragma solidity ^0.8.7;

// SPDX-License-Identifier: UNLICENSED

contract Wallet {
    address[] public approvers;
    uint public quorum;
    struct Transfer {
        uint id;
        uint amount;
        address payable to;
        uint approvals;
        bool sent;
    }
    Transfer[] public transfers;
    mapping(address => mapping(uint => bool)) public approvals;

    constructor(address[] memory _approvers, uint _quorum) {
        approvers = _approvers;
        quorum = _quorum;
    }

    modifier onlyApprover() {
        bool allowed = false;
        for (uint i; i < approvers.length; i++) {
            if (approvers[i] == msg.sender) {
                allowed = true;
            }
        }
        require(allowed == true, 'You are not part of the approvers list.');
        _;
    }
    

    function getApprovers() external view returns(address[] memory) {
        return approvers;
    }

    function getTransfers() external view returns(Transfer[] memory) {
        return transfers;
    }

    function createTransfer(uint amount, address payable to) external onlyApprover() {
        transfers.push(Transfer(
            {
                id: transfers.length,
                amount: amount,
                to: to,
                approvals: 0,
                sent: false
            }
            ));
    }

    function approveTransfer(uint id) external onlyApprover() {
        require(transfers[id].sent == false, 'Transfer has already been sent.');
        require(approvals[msg.sender][id] == false, 'Cannot approve transfer twice.');

        approvals[msg.sender][id] = true;
        transfers[id].approvals++;

        if (transfers[id].approvals >= quorum) {
            transfers[id].sent = true;
            address payable to = transfers[id].to;
            uint amount = transfers[id].amount;
            to.transfer(amount);
        }
    }

    receive() external payable {}

  
}