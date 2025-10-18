// lib/api.ts
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://202.155.95.183:3000",
  API_URL: process.env.NEXT_PUBLIC_API_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`
    : "http://202.155.95.183:3000/api",
  TIMEOUT: 30000,
}

export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken") || localStorage.getItem("mbg_token")
  
  const response = await fetch(`${API_CONFIG.API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Network Error" }))
    throw new Error(error.message || "API Error")
  }

  return response.json()
}
