if (!process.env.MYTHXL_ETH_ADDRESS && !process.env.MYTHX_EMAIL) {
  console.log('Please set either environment variable MYTHX_ETH_ADDRESS ' +
              'or MYTHX_EMAIL')
  process.exit(2)
}

if (!process.env.MYTHX_PASSWORD && !process.env.MYTHXL_API_KEY) {
  console.log('Please set environment variable MYTHX_PASSWORD or MYTHX_API_KEY')
  process.exit(3)
}
