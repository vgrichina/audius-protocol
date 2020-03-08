/**
 * Audius Smart Contracts truffle configuration
 * @authors Hareesh Nagaraj, Sid Sethi, Roneil Rumburg
 * @version 0.0.1
 */

// Import babel for ES6 support
require('babel-register')({
  presets: [
    ['env', {
      'targets': {
        'node': '8.0'
      }
    }]
  ]
})

require('babel-polyfill')

const { NearProvider, nearlib } = require('near-web3-provider');
const web3 = require('web3');

// Configuration for NEAR TestNet.
ACCOUNT_ID = 'vg-evm'
const fileKeyStore = new nearlib.keyStores.UnencryptedFileSystemKeyStore('neardev');
const networkId = 'default';
const defaultAccount = web3.utils.keccak256(ACCOUNT_ID).slice(26, 66);

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    near: {
      network_id: '99',
      provider: function() {
          return new NearProvider(
              // 'https://rpc.nearprotocol.com',
              'http://localhost:3030',
              fileKeyStore, ACCOUNT_ID, networkId, 'vg-evm');
      },
      from: defaultAccount,
      skipDryRun: true
    },

    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*' // Match any network id
    },
    test_local: {
      host: '127.0.0.1',
      port: 8555,
      network_id: '*' // Match any network id
    },
    audius_private: {
      host: '127.0.0.1',
      port: 8000,
      network_id: 1353,
      gasPrice: 1000000000
    },
    poa_mainnet: {
      host: 'localhost',
      port: 8545,
      network_id: '99',
      gas: 8000000,
      gasPrice: 1000000000,
      skipDryRun: true
    },
    poa_sokol: {
      host: 'localhost',
      port: 8545,
      network_id: '77',
      gas: 8000000,
      gasPrice: 1000000000,
      skipDryRun: true
    }
  },
  mocha: {
    enableTimeouts: false
  }
}
