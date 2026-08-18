const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
require('dotenv').config()

const app = express()

const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MaliOS API',
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`MaliOS API running on port ${PORT}`)
})
