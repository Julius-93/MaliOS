const API_BASE_URL = 'http://localhost:4000/api'

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Login failed')
  }

  return result.data
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Unable to load user')
  }

  return result.data.user
}

export async function getFinancialSummary(token) {
  const response = await fetch(`${API_BASE_URL}/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch financial summary')
  }

  return result.data
}

export async function getAccounts(token) {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch accounts')
  }

  return result.data
}

export async function getTransactions(token) {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch transactions')
  }

  return result.data
}
