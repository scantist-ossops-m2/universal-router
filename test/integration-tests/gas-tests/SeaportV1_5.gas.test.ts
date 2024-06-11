import { CommandType, RoutePlanner } from '../shared/planner'
import { UniversalRouter } from '../../../typechain'
import snapshotGasCost from '@uniswap/snapshot-gas-cost'
import {
  seaportV1_5Orders,
  seaportInterface,
  getAdvancedOrderParams,
  purchaseDataForTwoTownstarsSeaport,
} from '../shared/protocolHelpers/seaport'
import { resetFork } from '../shared/mainnetForkHelpers'
import { ALICE_ADDRESS, DEADLINE, OPENSEA_CONDUIT_KEY } from '../shared/constants'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import hre from 'hardhat'
import deployUniversalRouter from '../shared/deployUniversalRouter'
const { ethers } = hre

describe('Seaport v1.5 Gas Tests', () => {
  let router: UniversalRouter
  let planner: RoutePlanner

  describe('ETH -> NFT', () => {
    let alice: SignerWithAddress
    beforeEach(async () => {
      await resetFork()
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [ALICE_ADDRESS],
      })
      alice = await ethers.getSigner(ALICE_ADDRESS)
      router = (await deployUniversalRouter()).connect(alice) as UniversalRouter
      planner = new RoutePlanner()
    })

    it('gas: fulfillAdvancedOrder', async () => {
      const { advancedOrder, value } = getAdvancedOrderParams(seaportV1_5Orders[0])
      const calldata = seaportInterface.encodeFunctionData('fulfillAdvancedOrder', [
        advancedOrder,
        [],
        OPENSEA_CONDUIT_KEY,
        alice.address,
      ])

      planner.addCommand(CommandType.SEAPORT_V1_5, [value.toString(), calldata])
      const { commands, inputs } = planner

      await snapshotGasCost(router['execute(bytes,bytes[],uint256)'](commands, inputs, DEADLINE, { value }))
    })

    it('gas: fulfillAvailableAdvancedOrders 2 orders', async () => {
      const { calldata, value } = purchaseDataForTwoTownstarsSeaport(alice.address)

      planner.addCommand(CommandType.SEAPORT_V1_5, [value, calldata])
      const { commands, inputs } = planner

      await snapshotGasCost(router['execute(bytes,bytes[],uint256)'](commands, inputs, DEADLINE, { value }))
    })
  })
})
