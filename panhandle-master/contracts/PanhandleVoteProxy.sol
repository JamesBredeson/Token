// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "./libs/IBEP20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

interface IMasterChef {
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 rewardLockedUp;
        uint256 nextHarvestUntil;
    }

    function userInfo(uint256 pid, address user) external view returns (UserInfo memory);
}

contract PanhandleVoteProxy {
    using SafeMath for uint256;

    // Panhandle Token
    address public panhandle = 0x1f546aD641B56b86fD9dCEAc473d1C7a357276B7;
    // Master Chef
    address public masterChef = 0x058451C62B96c594aD984370eDA8B6FD7197bbd4;
    uint256 public panhandlePoolPid = 9;
    // Trading Pairs
    address public panhandleBNB = 0xC24AD5197DaeFD97DF28C70AcbDF17d9fF92a49B;
    uint256 public panhandleBNBFarmPid = 17;
    address public panhandleBUSD = 0x9287F5Ad55D7eE8EAE90B865718EB9A7cF3fb71A;
    uint256 public panhandleBUSDFarmPid = 16;
    // Vaults
    address public autoSharkPanhandlePool = 0x2Bc66d715FB0887A8708eCa5d83826eB063ba551;

    function decimals() external pure returns (uint8) {
        return uint8(18);
    }

    function name() external pure returns (string memory) {
        return "PanhandleToken Vote Proxy";
    }

    function symbol() external pure returns (string memory) {
        return "PANHANDLE-VOTE";
    }

    function totalSupply() external view returns (uint256) {
        return IBEP20(panhandle).totalSupply();
    }

    function balanceOf(address _voter) external view returns (uint256) {
        uint256 balance;

        // panhandle in wallet
        balance = balance.add(IBEP20(panhandle).balanceOf(_voter));
        // panhandle in panhandle pool
        balance = balance.add(IMasterChef(masterChef).userInfo(panhandlePoolPid, _voter).amount);
        // panhandle in PANHANDLE-BNB liquidity pool
        balance = balance.add(balanceInLiquidityPoolAndFarm(panhandleBNB, panhandleBNBFarmPid, _voter));
        // panhandle in PANHANDLE-BUSD liquidity pool
        balance = balance.add(balanceInLiquidityPoolAndFarm(panhandleBUSD, panhandleBUSDFarmPid, _voter));
        // panhandle in vaults
        balance = balance.add(IBEP20(autoSharkPanhandlePool).balanceOf(_voter));

        return balance;
    }

    function balanceInLiquidityPoolAndFarm(address pair, uint256 pid, address _voter) private view returns (uint256) {
        uint256 lpTotalSupply = IBEP20(pair).totalSupply();
        uint256 voterLpBalance = IBEP20(pair).balanceOf(_voter).add(IMasterChef(masterChef).userInfo(pid, _voter).amount);
        uint256 panhandleInLp = IBEP20(panhandle).balanceOf(pair);

        if (lpTotalSupply > 0) {
            return voterLpBalance.mul(1e8).div(lpTotalSupply).mul(panhandleInLp).div(1e8);
        }

        return 0;
    }
}
