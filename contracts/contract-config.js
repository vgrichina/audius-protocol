// config values stored by network name. see truffle-config.json for a mapping from network
// name to other params
module.exports = {
  'near': {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: '0xcccc36bE44D106C6aC14199A2Ed6a29fDa25d5Ae'
  },

  'development': {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: '0xcccc36bE44D106C6aC14199A2Ed6a29fDa25d5Ae'
  },
  'test_local': {
    verifierAddress: null,
    blacklisterAddress: null
  },
  'audius_private': {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0'
  },
  'poa_mainnet': {
    verifierAddress: '0xbeef8E42e8B5964fDD2b7ca8efA0d9aef38AA996',
    blacklisterAddress: '0xfeebEA99dE524ac668B6f151177EcA60b30A09c9'
  },
  'poa_sokol': {
    verifierAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0',
    blacklisterAddress: '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0'
  }
}
