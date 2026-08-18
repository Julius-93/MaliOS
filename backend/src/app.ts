import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import usersRouter from './routes/users'

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

app.use('/api/users', usersRouter)

app.listen(PORT, () => {
  console.log(`MaliOS API running on port ${PORT}`)
})
