import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import authRouter from './routes/auth'
import usersRouter from './routes/users'
import accountsRouter from './routes/accounts'
import transactionsRouter from './routes/transactions'
import summaryRouter from './routes/summary'
import budgetsRouter from './routes/budgets'
import cashFlowRouter from './routes/cashFlow'
import investmentsRouter from './routes/investments'
import portfolioRouter from './routes/portfolio'
import opportunitiesRouter from './routes/opportunities'
import goalsRouter from './routes/goals'
import settingsRouter from './routes/settings'
import notificationsRouter from './routes/notifications'
import insightsRouter from './routes/insights'

const app = express()

const PORT = process.env.PORT || 4000

// ========================================
// MIDDLEWARE
// ========================================

app.use(helmet())
app.use(cors())
app.use(express.json())

// ========================================
// HEALTH CHECK
// ========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MaliOS API',
    timestamp: new Date().toISOString(),
  })
})

// ========================================
// API ROUTES
// ========================================

app.use('/api/auth', authRouter)

app.use('/api/users', usersRouter)

app.use('/api/accounts', accountsRouter)

app.use('/api/transactions', transactionsRouter)

app.use('/api/summary', summaryRouter)

app.use('/api/budgets', budgetsRouter)

app.use('/api/cash-flow', cashFlowRouter)

app.use('/api/investments', investmentsRouter)

app.use('/api/portfolio', portfolioRouter)

app.use('/api/opportunities', opportunitiesRouter,)

app.use('/api/goals', goalsRouter)

app.use('/api/settings', settingsRouter)

app.use('/api/notifications', notificationsRouter)

app.use('/api/insights', insightsRouter)

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`MaliOS API running on port ${PORT}`)
})