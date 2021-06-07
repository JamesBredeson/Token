const { expectRevert } = require('@openzeppelin/test-helpers');
const { assert } = require("chai");

const PanhandleReferral = artifacts.require('PanhandleReferral');

contract('PanhandleReferral', ([alice, bob, carol, referrer, operator, owner]) => {
    beforeEach(async () => {
        this.panhandleReferral = await PanhandleReferral.new({ from: owner });
        this.zeroAddress = '0x0000000000000000000000000000000000000000';
    });

    it('should allow operator and only owner to update operator', async () => {
        assert.equal((await this.panhandleReferral.operators(operator)).valueOf(), false);
        await expectRevert(this.panhandleReferral.recordReferral(alice, referrer, { from: operator }), 'Operator: caller is not the operator');

        await expectRevert(this.panhandleReferral.updateOperator(operator, true, { from: carol }), 'Ownable: caller is not the owner');
        await this.panhandleReferral.updateOperator(operator, true, { from: owner });
        assert.equal((await this.panhandleReferral.operators(operator)).valueOf(), true);

        await this.panhandleReferral.updateOperator(operator, false, { from: owner });
        assert.equal((await this.panhandleReferral.operators(operator)).valueOf(), false);
        await expectRevert(this.panhandleReferral.recordReferral(alice, referrer, { from: operator }), 'Operator: caller is not the operator');
    });

    it('record referral', async () => {
        assert.equal((await this.panhandleReferral.operators(operator)).valueOf(), false);
        await this.panhandleReferral.updateOperator(operator, true, { from: owner });
        assert.equal((await this.panhandleReferral.operators(operator)).valueOf(), true);

        await this.panhandleReferral.recordReferral(this.zeroAddress, referrer, { from: operator });
        await this.panhandleReferral.recordReferral(alice, this.zeroAddress, { from: operator });
        await this.panhandleReferral.recordReferral(this.zeroAddress, this.zeroAddress, { from: operator });
        await this.panhandleReferral.recordReferral(alice, alice, { from: operator });
        assert.equal((await this.panhandleReferral.getReferrer(alice)).valueOf(), this.zeroAddress);
        assert.equal((await this.panhandleReferral.referralsCount(referrer)).valueOf(), '0');

        await this.panhandleReferral.recordReferral(alice, referrer, { from: operator });
        assert.equal((await this.panhandleReferral.getReferrer(alice)).valueOf(), referrer);
        assert.equal((await this.panhandleReferral.referralsCount(referrer)).valueOf(), '1');

        assert.equal((await this.panhandleReferral.referralsCount(bob)).valueOf(), '0');
        await this.panhandleReferral.recordReferral(alice, bob, { from: operator });
        assert.equal((await this.panhandleReferral.referralsCount(bob)).valueOf(), '0');
        assert.equal((await this.panhandleReferral.getReferrer(alice)).valueOf(), referrer);

        await this.panhandleReferral.recordReferral(carol, referrer, { from: operator });
        assert.equal((await this.panhandleReferral.getReferrer(carol)).valueOf(), referrer);
        assert.equal((await this.panhandleReferral.referralsCount(referrer)).valueOf(), '2');
    });

    it('record referral commission', async () => {
        assert.equal((await this.panhandleReferral.totalReferralCommissions(referrer)).valueOf(), '0');

        await expectRevert(this.panhandleReferral.recordReferralCommission(referrer, 1, { from: operator }), 'Operator: caller is not the operator');
        await this.panhandleReferral.updateOperator(operator, true, { from: owner });
        assert.equal((await this.panhandleReferral.operators(operator)).valueOf(), true);

        await this.panhandleReferral.recordReferralCommission(referrer, 1, { from: operator });
        assert.equal((await this.panhandleReferral.totalReferralCommissions(referrer)).valueOf(), '1');

        await this.panhandleReferral.recordReferralCommission(referrer, 0, { from: operator });
        assert.equal((await this.panhandleReferral.totalReferralCommissions(referrer)).valueOf(), '1');

        await this.panhandleReferral.recordReferralCommission(referrer, 111, { from: operator });
        assert.equal((await this.panhandleReferral.totalReferralCommissions(referrer)).valueOf(), '112');

        await this.panhandleReferral.recordReferralCommission(this.zeroAddress, 100, { from: operator });
        assert.equal((await this.panhandleReferral.totalReferralCommissions(this.zeroAddress)).valueOf(), '0');
    });
});
