const { expectRevert } = require("@openzeppelin/test-helpers");
const { assert } = require("chai");

const PanhandleToken = artifacts.require('PanhandleToken');

contract('PanhandleToken', ([alice, bob, carol, operator, owner]) => {
    beforeEach(async () => {
        this.panhandle = await PanhandleToken.new({ from: owner });
        this.burnAddress = '0x000000000000000000000000000000000000dEaD';
        this.zeroAddress = '0x0000000000000000000000000000000000000000';
    });

    it('only operator', async () => {
        assert.equal((await this.panhandle.owner()), owner);
        assert.equal((await this.panhandle.operator()), owner);

        await expectRevert(this.panhandle.updateTransferTaxRate(500, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.panhandle.updateBurnRate(20, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.panhandle.updateMaxTransferAmountRate(100, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.panhandle.updateSwapAndLiquifyEnabled(true, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.panhandle.setExcludedFromAntiWhale(operator, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.panhandle.updatePanhandleSwapRouter(operator, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.panhandle.updateMinAmountToLiquify(100, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.panhandle.transferOperator(alice, { from: operator }), 'operator: caller is not the operator');
    });

    it('transfer operator', async () => {
        await expectRevert(this.panhandle.transferOperator(operator, { from: operator }), 'operator: caller is not the operator');
        await this.panhandle.transferOperator(operator, { from: owner });
        assert.equal((await this.panhandle.operator()), operator);

        await expectRevert(this.panhandle.transferOperator(this.zeroAddress, { from: operator }), 'PANHANDLE::transferOperator: new operator is the zero address');
    });

    it('update transfer tax rate', async () => {
        await this.panhandle.transferOperator(operator, { from: owner });
        assert.equal((await this.panhandle.operator()), operator);

        assert.equal((await this.panhandle.transferTaxRate()).toString(), '500');
        assert.equal((await this.panhandle.burnRate()).toString(), '20');

        await this.panhandle.updateTransferTaxRate(0, { from: operator });
        assert.equal((await this.panhandle.transferTaxRate()).toString(), '0');
        await this.panhandle.updateTransferTaxRate(1000, { from: operator });
        assert.equal((await this.panhandle.transferTaxRate()).toString(), '1000');
        await expectRevert(this.panhandle.updateTransferTaxRate(1001, { from: operator }), 'PANHANDLE::updateTransferTaxRate: Transfer tax rate must not exceed the maximum rate.');

        await this.panhandle.updateBurnRate(0, { from: operator });
        assert.equal((await this.panhandle.burnRate()).toString(), '0');
        await this.panhandle.updateBurnRate(100, { from: operator });
        assert.equal((await this.panhandle.burnRate()).toString(), '100');
        await expectRevert(this.panhandle.updateBurnRate(101, { from: operator }), 'PANHANDLE::updateBurnRate: Burn rate must not exceed the maximum rate.');
    });

    it('transfer', async () => {
        await this.panhandle.transferOperator(operator, { from: owner });
        assert.equal((await this.panhandle.operator()), operator);

        await this.panhandle.mint(alice, 10000000, { from: owner }); // max transfer amount 25,000
        assert.equal((await this.panhandle.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.panhandle.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.panhandle.balanceOf(this.panhandle.address)).toString(), '0');

        await this.panhandle.transfer(bob, 12345, { from: alice });
        assert.equal((await this.panhandle.balanceOf(alice)).toString(), '9987655');
        assert.equal((await this.panhandle.balanceOf(bob)).toString(), '11728');
        assert.equal((await this.panhandle.balanceOf(this.burnAddress)).toString(), '123');
        assert.equal((await this.panhandle.balanceOf(this.panhandle.address)).toString(), '494');

        await this.panhandle.approve(carol, 22345, { from: alice });
        await this.panhandle.transferFrom(alice, carol, 22345, { from: carol });
        assert.equal((await this.panhandle.balanceOf(alice)).toString(), '9965310');
        assert.equal((await this.panhandle.balanceOf(carol)).toString(), '21228');
        assert.equal((await this.panhandle.balanceOf(this.burnAddress)).toString(), '346');
        assert.equal((await this.panhandle.balanceOf(this.panhandle.address)).toString(), '1388');
    });

    it('transfer small amount', async () => {
        await this.panhandle.transferOperator(operator, { from: owner });
        assert.equal((await this.panhandle.operator()), operator);

        await this.panhandle.mint(alice, 10000000, { from: owner });
        assert.equal((await this.panhandle.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.panhandle.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.panhandle.balanceOf(this.panhandle.address)).toString(), '0');

        await this.panhandle.transfer(bob, 19, { from: alice });
        assert.equal((await this.panhandle.balanceOf(alice)).toString(), '9999981');
        assert.equal((await this.panhandle.balanceOf(bob)).toString(), '19');
        assert.equal((await this.panhandle.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.panhandle.balanceOf(this.panhandle.address)).toString(), '0');
    });

    it('transfer without transfer tax', async () => {
        await this.panhandle.transferOperator(operator, { from: owner });
        assert.equal((await this.panhandle.operator()), operator);

        assert.equal((await this.panhandle.transferTaxRate()).toString(), '500');
        assert.equal((await this.panhandle.burnRate()).toString(), '20');

        await this.panhandle.updateTransferTaxRate(0, { from: operator });
        assert.equal((await this.panhandle.transferTaxRate()).toString(), '0');

        await this.panhandle.mint(alice, 10000000, { from: owner });
        assert.equal((await this.panhandle.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.panhandle.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.panhandle.balanceOf(this.panhandle.address)).toString(), '0');

        await this.panhandle.transfer(bob, 10000, { from: alice });
        assert.equal((await this.panhandle.balanceOf(alice)).toString(), '9990000');
        assert.equal((await this.panhandle.balanceOf(bob)).toString(), '10000');
        assert.equal((await this.panhandle.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.panhandle.balanceOf(this.panhandle.address)).toString(), '0');
    });

    it('transfer without burn', async () => {
        await this.panhandle.transferOperator(operator, { from: owner });
        assert.equal((await this.panhandle.operator()), operator);

        assert.equal((await this.panhandle.transferTaxRate()).toString(), '500');
        assert.equal((await this.panhandle.burnRate()).toString(), '20');

        await this.panhandle.updateBurnRate(0, { from: operator });
        assert.equal((await this.panhandle.burnRate()).toString(), '0');

        await this.panhandle.mint(alice, 10000000, { from: owner });
        assert.equal((await this.panhandle.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.panhandle.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.panhandle.balanceOf(this.panhandle.address)).toString(), '0');

        await this.panhandle.transfer(bob, 1234, { from: alice });
        assert.equal((await this.panhandle.balanceOf(alice)).toString(), '9998766');
        assert.equal((await this.panhandle.balanceOf(bob)).toString(), '1173');
        assert.equal((await this.panhandle.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.panhandle.balanceOf(this.panhandle.address)).toString(), '61');
    });

    it('transfer all burn', async () => {
        await this.panhandle.transferOperator(operator, { from: owner });
        assert.equal((await this.panhandle.operator()), operator);

        assert.equal((await this.panhandle.transferTaxRate()).toString(), '500');
        assert.equal((await this.panhandle.burnRate()).toString(), '20');

        await this.panhandle.updateBurnRate(100, { from: operator });
        assert.equal((await this.panhandle.burnRate()).toString(), '100');

        await this.panhandle.mint(alice, 10000000, { from: owner });
        assert.equal((await this.panhandle.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.panhandle.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.panhandle.balanceOf(this.panhandle.address)).toString(), '0');

        await this.panhandle.transfer(bob, 1234, { from: alice });
        assert.equal((await this.panhandle.balanceOf(alice)).toString(), '9998766');
        assert.equal((await this.panhandle.balanceOf(bob)).toString(), '1173');
        assert.equal((await this.panhandle.balanceOf(this.burnAddress)).toString(), '61');
        assert.equal((await this.panhandle.balanceOf(this.panhandle.address)).toString(), '0');
    });

    it('max transfer amount', async () => {
        assert.equal((await this.panhandle.maxTransferAmountRate()).toString(), '50');
        assert.equal((await this.panhandle.maxTransferAmount()).toString(), '0');

        await this.panhandle.mint(alice, 1000000, { from: owner });
        assert.equal((await this.panhandle.maxTransferAmount()).toString(), '5000');

        await this.panhandle.mint(alice, 1000, { from: owner });
        assert.equal((await this.panhandle.maxTransferAmount()).toString(), '5005');

        await this.panhandle.transferOperator(operator, { from: owner });
        assert.equal((await this.panhandle.operator()), operator);

        await this.panhandle.updateMaxTransferAmountRate(100, { from: operator }); // 1%
        assert.equal((await this.panhandle.maxTransferAmount()).toString(), '10010');
    });

    it('anti whale', async () => {
        await this.panhandle.transferOperator(operator, { from: owner });
        assert.equal((await this.panhandle.operator()), operator);

        assert.equal((await this.panhandle.isExcludedFromAntiWhale(operator)), false);
        await this.panhandle.setExcludedFromAntiWhale(operator, true, { from: operator });
        assert.equal((await this.panhandle.isExcludedFromAntiWhale(operator)), true);

        await this.panhandle.mint(alice, 10000, { from: owner });
        await this.panhandle.mint(bob, 10000, { from: owner });
        await this.panhandle.mint(carol, 10000, { from: owner });
        await this.panhandle.mint(operator, 10000, { from: owner });
        await this.panhandle.mint(owner, 10000, { from: owner });

        // total supply: 50,000, max transfer amount: 250
        assert.equal((await this.panhandle.maxTransferAmount()).toString(), '250');
        await expectRevert(this.panhandle.transfer(bob, 251, { from: alice }), 'PANHANDLE::antiWhale: Transfer amount exceeds the maxTransferAmount');
        await this.panhandle.approve(carol, 251, { from: alice });
        await expectRevert(this.panhandle.transferFrom(alice, carol, 251, { from: carol }), 'PANHANDLE::antiWhale: Transfer amount exceeds the maxTransferAmount');

        //
        await this.panhandle.transfer(bob, 250, { from: alice });
        await this.panhandle.transferFrom(alice, carol, 250, { from: carol });

        await this.panhandle.transfer(this.burnAddress, 251, { from: alice });
        await this.panhandle.transfer(operator, 251, { from: alice });
        await this.panhandle.transfer(owner, 251, { from: alice });
        await this.panhandle.transfer(this.panhandle.address, 251, { from: alice });

        await this.panhandle.transfer(alice, 251, { from: operator });
        await this.panhandle.transfer(alice, 251, { from: owner });
        await this.panhandle.transfer(owner, 251, { from: operator });
    });

    it('update SwapAndLiquifyEnabled', async () => {
        await expectRevert(this.panhandle.updateSwapAndLiquifyEnabled(true, { from: operator }), 'operator: caller is not the operator');
        assert.equal((await this.panhandle.swapAndLiquifyEnabled()), false);

        await this.panhandle.transferOperator(operator, { from: owner });
        assert.equal((await this.panhandle.operator()), operator);

        await this.panhandle.updateSwapAndLiquifyEnabled(true, { from: operator });
        assert.equal((await this.panhandle.swapAndLiquifyEnabled()), true);
    });

    it('update min amount to liquify', async () => {
        await expectRevert(this.panhandle.updateMinAmountToLiquify(100, { from: operator }), 'operator: caller is not the operator');
        assert.equal((await this.panhandle.minAmountToLiquify()).toString(), '500000000000000000000');

        await this.panhandle.transferOperator(operator, { from: owner });
        assert.equal((await this.panhandle.operator()), operator);

        await this.panhandle.updateMinAmountToLiquify(100, { from: operator });
        assert.equal((await this.panhandle.minAmountToLiquify()).toString(), '100');
    });
});
