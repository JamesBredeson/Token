const { expectRevert } = require('@openzeppelin/test-helpers');
const { assert } = require("chai");
const PanhandleLocker = artifacts.require('PanhandleLocker');
const MockBEP20 = artifacts.require('libs/MockBEP20');


contract('PanhandleLocker', ([alice, bob, carol, owner]) => {
    beforeEach(async () => {
        this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: owner });
        this.panhandleLocker = await PanhandleLocker.new({ from: owner });
    });

    it('only owner', async () => {
        assert.equal((await this.panhandleLocker.owner()), owner);

        // lock
        await this.lp1.transfer(this.panhandleLocker.address, '2000', { from: owner });
        assert.equal((await this.lp1.balanceOf(this.panhandleLocker.address)).toString(), '2000');

        await expectRevert(this.panhandleLocker.unlock(this.lp1.address, bob, { from: bob }), 'Ownable: caller is not the owner');
        await this.panhandleLocker.unlock(this.lp1.address, carol, { from: owner });
        assert.equal((await this.lp1.balanceOf(carol)).toString(), '2000');
        assert.equal((await this.lp1.balanceOf(this.panhandleLocker.address)).toString(), '0');
    });
})
