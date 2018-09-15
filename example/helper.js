if (!process.env.MYTHRIL_API_KEY) {
  console.log('Please set environment variable MYTHRIL_API_KEY')
  process.exit(2)
}
if (!process.env.EMAIL) {
  console.log('Please set environment variable EMAIL')
  process.exit(3)
}
