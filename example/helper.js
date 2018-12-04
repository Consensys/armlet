if (!process.env.MYTHRIL_ETH_ADDRESS && !process.env.MYTHRIL_EMAIL) {
  console.log('Please set either environment variable MYTHRIL_ETH_ADDRESS ' +
              'or MYTHRIL_EMAIL')
  process.exit(2)
}

if (!process.env.MYTHRIL_PASSWORD && !process.env.MYTHRIL_API_KEY) {
  console.log('Please set environment variable MYTHRIL_PASSWORD or MYTHRIL_API_KEY')
  process.exit(3)
}
