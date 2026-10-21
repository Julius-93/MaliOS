const API_BASE_URL =
  'http://localhost:4000/api'


/*
 * ========================================
 * SHARED HELPERS
 * ========================================
 */

function authHeaders(token) {
  return {
    Authorization:
      `Bearer ${token}`,
  }
}


function jsonAuthHeaders(token) {
  return {
    'Content-Type':
      'application/json',

    Authorization:
      `Bearer ${token}`,
  }
}


/*
 * Safely read a JSON response.
 *
 * This prevents confusing errors if
 * the backend accidentally returns
 * HTML or an empty response.
 */
async function readJson(response) {
  const contentType =
    response.headers.get(
      'content-type',
    )

  if (
    contentType?.includes(
      'application/json',
    )
  ) {
    return response.json()
  }

  const text =
    await response.text()

  return {
    error:
      text ||
      'Unexpected server response',
  }
}


/*
 * ========================================
 * AUTHENTICATION
 * ========================================
 */

export async function login(
  email,
  password,
) {
  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        email,
        password,
      }),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to sign in',
    )
  }

  return result.data
}


export async function getCurrentUser(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load user',
    )
  }

  return result.data.user
}

export async function changePassword(
  token,
  passwords,
) {
  const response = await fetch(
    `${API_BASE_URL}/auth/password`,
    {
      method: 'PATCH',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(
          passwords,
        ),
    },
  )


  const result =
    await readJson(response)


  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to change password',
    )
  }


  return result.data
}

/*
 * ========================================
 * DASHBOARD / SUMMARY
 * ========================================
 */

export async function getFinancialSummary(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/summary`,
    {
      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load financial summary',
    )
  }

  return result.data
}


/*
 * ========================================
 * ACCOUNTS
 * ========================================
 */

export async function getAccounts(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/accounts`,
    {
      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load accounts',
    )
  }

  return result.data
}


export async function createAccount(
  token,
  account,
) {
  const response = await fetch(
    `${API_BASE_URL}/accounts`,
    {
      method: 'POST',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(account),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to create account',
    )
  }

  return result.data
}


/*
 * ========================================
 * TRANSACTIONS
 * ========================================
 */

export async function getTransactions(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/transactions`,
    {
      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load transactions',
    )
  }

  return result.data
}


export async function createTransaction(
  token,
  transaction,
) {
  const response = await fetch(
    `${API_BASE_URL}/transactions`,
    {
      method: 'POST',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(
          transaction,
        ),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to create transaction',
    )
  }

  return result.data
}


/*
 * ========================================
 * BUDGETS
 * ========================================
 */

export async function getBudgets(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/budgets`,
    {
      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load budgets',
    )
  }

  return result.data
}


export async function createBudget(
  token,
  budget,
) {
  const response = await fetch(
    `${API_BASE_URL}/budgets`,
    {
      method: 'POST',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(budget),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to create budget',
    )
  }

  return result.data
}


export async function updateBudget(
  token,
  budgetId,
  updates,
) {
  const response = await fetch(
    `${API_BASE_URL}/budgets/${budgetId}`,
    {
      method: 'PATCH',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(updates),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to update budget',
    )
  }

  return result.data
}


export async function deleteBudget(
  token,
  budgetId,
) {
  const response = await fetch(
    `${API_BASE_URL}/budgets/${budgetId}`,
    {
      method: 'DELETE',

      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to delete budget',
    )
  }

  return result.data
}


/*
 * ========================================
 * CASH FLOW
 * ========================================
 */

export async function getCashFlow(
  token,
  startDate = '',
  endDate = '',
) {
  const params =
    new URLSearchParams()

  if (startDate) {
    params.set(
      'startDate',
      startDate,
    )
  }

  if (endDate) {
    params.set(
      'endDate',
      endDate,
    )
  }

  const query =
    params.toString()

  const url =
    query
      ? `${API_BASE_URL}/cash-flow?${query}`
      : `${API_BASE_URL}/cash-flow`

  const response =
    await fetch(
      url,
      {
        headers:
          authHeaders(token),
      },
    )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load cash flow',
    )
  }

  return result.data
}


/*
 * ========================================
 * INVESTMENTS
 * ========================================
 */

export async function getInvestments(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/investments`,
    {
      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load investments',
    )
  }

  return result.data
}


export async function createInvestmentAccount(
  token,
  account,
) {
  const response = await fetch(
    `${API_BASE_URL}/investments/accounts`,
    {
      method: 'POST',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(account),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to create investment account',
    )
  }

  return result.data
}


export async function createInvestmentHolding(
  token,
  accountId,
  holding,
) {
  const response = await fetch(
    `${API_BASE_URL}/investments/accounts/${accountId}/holdings`,
    {
      method: 'POST',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(holding),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to create investment holding',
    )
  }

  return result.data
}


export async function updateInvestmentHolding(
  token,
  holdingId,
  updates,
) {
  const response = await fetch(
    `${API_BASE_URL}/investments/holdings/${holdingId}`,
    {
      method: 'PATCH',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(updates),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to update investment holding',
    )
  }

  return result.data
}


export async function deleteInvestmentHolding(
  token,
  holdingId,
) {
  const response = await fetch(
    `${API_BASE_URL}/investments/holdings/${holdingId}`,
    {
      method: 'DELETE',

      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to delete investment holding',
    )
  }

  return result.data
}


export async function deleteInvestmentAccount(
  token,
  accountId,
) {
  const response = await fetch(
    `${API_BASE_URL}/investments/accounts/${accountId}`,
    {
      method: 'DELETE',

      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to delete investment account',
    )
  }

  return result.data
}


/*
 * ========================================
 * PORTFOLIO
 * ========================================
 */

export async function getPortfolio(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/portfolio`,
    {
      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load portfolio',
    )
  }

  return result.data
}


/*
 * ========================================
 * INVESTMENT OPPORTUNITIES
 * ========================================
 */

export async function getOpportunities(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/opportunities`,
    {
      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load investment opportunities',
    )
  }

  return result.data
}


export async function createOpportunity(
  token,
  opportunity,
) {
  const response = await fetch(
    `${API_BASE_URL}/opportunities`,
    {
      method: 'POST',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(
          opportunity,
        ),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to create investment opportunity',
    )
  }

  return result.data
}


export async function updateOpportunity(
  token,
  opportunityId,
  updates,
) {
  const response = await fetch(
    `${API_BASE_URL}/opportunities/${opportunityId}`,
    {
      method: 'PATCH',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(updates),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to update investment opportunity',
    )
  }

  return result.data
}


export async function deleteOpportunity(
  token,
  opportunityId,
) {
  const response = await fetch(
    `${API_BASE_URL}/opportunities/${opportunityId}`,
    {
      method: 'DELETE',

      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to delete investment opportunity',
    )
  }

  return result.data
}


/*
 * ========================================
 * FINANCIAL GOALS
 * ========================================
 */

export async function getGoals(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/goals`,
    {
      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load financial goals',
    )
  }

  return result.data
}


export async function createGoal(
  token,
  goal,
) {
  const response = await fetch(
    `${API_BASE_URL}/goals`,
    {
      method: 'POST',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(goal),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to create financial goal',
    )
  }

  return result.data
}


export async function updateGoal(
  token,
  goalId,
  updates,
) {
  const response = await fetch(
    `${API_BASE_URL}/goals/${goalId}`,
    {
      method: 'PATCH',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(updates),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to update financial goal',
    )
  }

  return result.data
}


export async function deleteGoal(
  token,
  goalId,
) {
  const response = await fetch(
    `${API_BASE_URL}/goals/${goalId}`,
    {
      method: 'DELETE',

      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to delete financial goal',
    )
  }

  return result.data
}


/*
 * ========================================
 * SETTINGS
 * ========================================
 */

export async function getSettings(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/settings`,
    {
      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load account settings',
    )
  }

  return result.data
}


export async function updateProfile(
  token,
  updates,
) {
  const response = await fetch(
    `${API_BASE_URL}/settings/profile`,
    {
      method: 'PATCH',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(updates),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to update profile',
    )
  }

  return result.data
}


export async function updatePreferences(
  token,
  updates,
) {
  const response = await fetch(
    `${API_BASE_URL}/settings/preferences`,
    {
      method: 'PATCH',

      headers:
        jsonAuthHeaders(token),

      body:
        JSON.stringify(updates),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to update settings',
    )
  }

  return result.data
}


/*
 * ========================================
 * SESSION MANAGEMENT
 * ========================================
 */

export async function signOutAllSessions(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/settings/sessions`,
    {
      method: 'DELETE',

      headers:
        authHeaders(token),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to sign out sessions',
    )
  }

  return result.data
}


/*
 * ========================================
 * DATA EXPORT
 * ========================================
 */

export async function exportMaliosData(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/settings/export/json`,
    {
      headers:
        authHeaders(token),
    },
  )

  if (!response.ok) {
    const result =
      await readJson(response)

    throw new Error(
      result.error ||
        'Unable to export MaliOS data',
    )
  }

  return response.json()
}


export async function exportTransactionsCsv(
  token,
) {
  const response = await fetch(
    `${API_BASE_URL}/settings/export/transactions.csv`,
    {
      headers:
        authHeaders(token),
    },
  )

  if (!response.ok) {
    const result =
      await readJson(response)

    throw new Error(
      result.error ||
        'Unable to export transactions',
    )
  }

  return response.blob()
}


/*
 * ========================================
 * DELETE ACCOUNT
 * ========================================
 */

export async function deleteAccount(
  token,
  confirmation,
) {
  const response = await fetch(
    `${API_BASE_URL}/settings/account`,
    {
      method: 'DELETE',

      headers:
        jsonAuthHeaders(token),

      body: JSON.stringify({
        confirmation,
      }),
    },
  )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to delete account',
    )
  }

  return result.data
}

/* ========================================
   NOTIFICATIONS
======================================== */

export async function getNotifications(
  token,
  limit = 50,
  options = {},
) {
  const params =
    new URLSearchParams()


  params.set(
    'limit',
    String(limit),
  )


  if (
    options.status
  ) {
    params.set(
      'status',
      options.status,
    )
  }


  if (
    options.type
  ) {
    params.set(
      'type',
      options.type,
    )
  }


  const response =
    await fetch(
      `${API_BASE_URL}/notifications?${params.toString()}`,
      {
        headers:
          authHeaders(token),
      },
    )


  const result =
    await readJson(response)


  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load notifications',
    )
  }


  return result.data
}


export async function markAllNotificationsRead(
  token,
) {
  const response =
    await fetch(
      `${API_BASE_URL}/notifications/read-all`,
      {
        method: 'PATCH',
        headers:
          jsonAuthHeaders(token),
      },
    )

  const result =
    await readJson(response)

  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to update notifications',
    )
  }

  return result.data
}

export async function deleteNotification(
  token,
  notificationId,
) {
  const response =
    await fetch(
      `${API_BASE_URL}/notifications/${notificationId}`,
      {
        method: 'DELETE',
        headers:
          jsonAuthHeaders(token),
      },
    )


  const result =
    await readJson(response)


  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to delete notification',
    )
  }


  return result.data
}


export async function clearReadNotifications(
  token,
) {
  const response =
    await fetch(
      `${API_BASE_URL}/notifications/read`,
      {
        method: 'DELETE',
        headers:
          jsonAuthHeaders(token),
      },
    )


  const result =
    await readJson(response)


  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to clear notifications',
    )
  }


  return result.data
}

export async function markNotificationRead(
  token,
  notificationId,
) {
  const response =
    await fetch(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {
        method: 'PATCH',

        headers:
          jsonAuthHeaders(token),
      },
    )


  const result =
    await readJson(response)


  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to mark notification as read',
    )
  }


  return result.data
}

/* ========================================
   FINANCIAL INSIGHTS
======================================== */

export async function getFinancialInsights(
  token,
) {
  const response =
    await fetch(
      `${API_BASE_URL}/insights`,
      {
        headers:
          authHeaders(token),
      },
    )


  const result =
    await readJson(response)


  if (!response.ok) {
    throw new Error(
      result.error ||
        'Unable to load financial insights',
    )
  }


  return result.data
}