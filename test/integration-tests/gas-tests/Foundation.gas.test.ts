import FOUNDATION_ABI from '../shared/abis/Foundation.json'
import { UniversalRouter } from '../../../typechain'
import { resetFork } from '../shared/mainnetForkHelpers'
import { ALICE_ADDRESS, DEADLINE } from '../shared/constants'
import snapshotGasCost from '@uniswap/snapshot-gas-cost'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import hre from 'hardhat'
import { BigNumber } from 'ethers'
import { CommandType, RoutePlanner } from '../shared/planner'
import deployUniversalRouter from '../shared/deployUniversalRouter'
const { ethers } = hre

const FOUNDATION_INTERFACE = new ethers.utils.Interface(FOUNDATION_ABI)
const MENTAL_WORLDS_ADDRESS = '0xEf96021Af16BD04918b0d87cE045d7984ad6c38c'
const REFERRER = '0x459e213D8B5E79d706aB22b945e3aF983d51BC4C'

describe('Foundation Gas Tests', () => {
  let alice: SignerWithAddress
  let router: UniversalRouter
  let planner: RoutePlanner

  beforeEach(async () => {
    planner = new RoutePlanner()
    alice = await ethers.getSigner(ALICE_ADDRESS)
  })

  // In this test we will buy token id 32 of mental worlds NFT (0xEf96021Af16BD04918b0d87cE045d7984ad6c38c),
  // which costs 0.01 ETH
  describe('Buy a mental worlds NFT from Foundation', () => {
    beforeEach(async () => {
      await resetFork()
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [ALICE_ADDRESS],
      })
      router = (await deployUniversalRouter()).connect(alice) as UniversalRouter
    })

    it('gas: token id 32 of mental worlds', async () => {
      const value = BigNumber.from('10000000000000000')
      const calldata = FOUNDATION_INTERFACE.encodeFunctionData('buyV2', [MENTAL_WORLDS_ADDRESS, 32, value, REFERRER])
      planner.addCommand(CommandType.FOUNDATION, [value, calldata, ALICE_ADDRESS, MENTAL_WORLDS_ADDRESS, 32])

      const { commands, inputs } = planner

      await snapshotGasCost(router['execute(bytes,bytes[],uint256)'](commands, inputs, DEADLINE, { value: value }))
    })
  })
})
