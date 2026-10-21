import {
  Router,
  type Response,
} from 'express'

import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'

import {
  generateFinancialInsights,
} from '../services/insightService'


const router =
  Router()


router.use(
  requireAuth,
)


/* ========================================
   GET FINANCIAL INSIGHTS
======================================== */

router.get(
  '/',
  async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    try {
      const userId =
        req.user!.id


      const data =
        await generateFinancialInsights(
          userId,
        )


      return res.json({
        data,
      })

    } catch (error) {
      console.error(
        'Unable to generate financial insights:',
        error,
      )


      return res.status(500).json({
        error:
          'Unable to generate financial insights',
      })
    }
  },
)


export default router