const Wallet = artifacts.require("Wallet");
const { expectRevert } = require("@openzeppelin/test-helpers");

contract("Wallet", (accounts) => {
  let wallet;

  beforeEach(async () => {
    wallet = await Wallet.new([accounts[0], accounts[1], accounts[2]], 2);
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: wallet.address,
      value: 1000,
    });
  });

  it("should have correct approvers and quorum", async () => {
    const approvers = await wallet.getApprovers();
    const quorum = await wallet.quorum();

    assert(approvers.length === 3);
    assert(approvers[0] === accounts[0]);
    assert(approvers[1] === accounts[1]);
    assert(approvers[2] === accounts[2]);
    assert(quorum.toNumber() == 2);
  });

  it("should create transfers", async () => {
    await wallet.createTransfer(100, accounts[4], { from: accounts[0] });
    const transfers = await wallet.getTransfers();
    assert(transfers.length === 1);
    assert(transfers[0].id === "0");
    assert(transfers[0].amount === "100");
    assert(transfers[0].to === accounts[4]);
    assert(transfers[0].approvals === "0");
    assert(transfers[0].sent === false);
  });

  it("should NOT create transfer if sender is not approved", async () => {
    await expectRevert(
      wallet.createTransfer(100, accounts[4], { from: accounts[5] }),
      "You are not part of the approvers list."
    );
  });

  it("should increment approvals", async () => {
    await wallet.createTransfer(100, accounts[4], { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[0] });
    const transfers = await wallet.getTransfers();
    const balance = await web3.eth.getBalance(wallet.address);
    assert(transfers[0].approvals === "1");
    assert(transfers[0].sent === false);
    assert(balance === "1000");
  });

  it("should send transfer if quorum reached", async () => {
    const balanceBefore = web3.utils.toBN(
      await web3.eth.getBalance(accounts[6])
    );
    await wallet.createTransfer(100, accounts[6], { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[1] });
    const balanceAfter = web3.utils.toBN(
      await web3.eth.getBalance(accounts[6])
    );
    assert(balanceAfter.sub(balanceBefore).toNumber() === 100);
  });

  it("should NOT approve transfer if sender is not an approver", async () => {
    await wallet.createTransfer(100, accounts[6], { from: accounts[0] });
    await expectRevert(
      wallet.approveTransfer(0, { from: accounts[6] }),
      "You are not part of the approvers list."
    );
  });

  it("should NOT approve transfer if transfer is already sent", async () => {
    await wallet.createTransfer(100, accounts[6], { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[1] });
    await expectRevert(
      wallet.approveTransfer(0, { from: accounts[0] }),
      "Transfer has already been sent."
    );
  });

  it("should NOT approve transfer twice", async () => {
    await wallet.createTransfer(100, accounts[6], { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[0] });
    await expectRevert(
      wallet.approveTransfer(0, { from: accounts[0] }),
      "Cannot approve transfer twice."
    );
  });
});
