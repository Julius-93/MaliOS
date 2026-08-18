const API_BASE_URL = 'http://localhost:4000/api'

export async function getFinancialSummary(userId) {
  const response = await fetch(`${API_BASE_URL}/summary/${userId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch financial summary')
  }

  const result = await response.json()

  return result.data
}
