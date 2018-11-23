if (!process.env.MYTHRIL_ETH_ADDRESS && !process.env.EMAIL) {
  console.log('Please set either environment variable MYTHRIL_ETH_ADDRESS ' +
              'or EMAIL')
  process.exit(2)
}
if (!process.env.MYTHRIL_PASSWORD) {
  console.log('Please set environment variable MYTHRIL_PASSWORD')
  process.exit(3)
}
