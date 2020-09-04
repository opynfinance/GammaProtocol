import Web3 from 'web3'
import {HttpProvider} from 'web3-core'

export default class Reverter {
  // Web3 instance
  readonly web3: Web3
  snapshotId = 0

  constructor(web3: Web3) {
    this.web3 = web3
  }

  revert() {
    return new Promise((resolve, reject) => {
      this.web3.currentProvider &&
        (this.web3.currentProvider as HttpProvider).send(
          {
            jsonrpc: '2.0',
            method: 'evm_revert',
            id: new Date().getTime(),
            params: [this.snapshotId],
          },
          (err, result) => {
            if (err) {
              return reject(err)
            }
            return resolve(this.snapshot())
          },
        )
    })
  }

  snapshot() {
    return new Promise((resolve, reject) => {
      this.web3.currentProvider &&
        (this.web3.currentProvider as HttpProvider).send(
          {
            jsonrpc: '2.0',
            method: 'evm_snapshot',
            id: new Date().getTime(),
            params: [],
          },
          (err, result) => {
            if (err) {
              return reject(err)
            }
            this.snapshotId = result && web3.utils.toDecimal(result.result)
            return resolve()
          },
        )
    })
  }
}
