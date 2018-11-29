if (!process.env.MYTHRIL_ETH_ADDRESS) {
  console.log('Please set environment variable MYTHRIL_ETH_ADDRESS.')
  process.exit(2)
}
if (!process.env.MYTHRIL_PASSWORD) {
  console.log('Please set environment variable MYTHRIL_PASSWORD.')
  process.exit(3)
}
