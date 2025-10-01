import { useCallback, useEffect, useState } from "react"

interface Credentials {
  tenant_id: string
  apiKey: string
  enterprise_id: string
}

const CREDENTIALS_STORAGE_KEY = "esper-credentials"

interface UseCredentialsResult {
  credentials: Credentials
  updateCredentials: (newCredentials: Credentials) => void
  clearStoredCredentials: () => void
  hasStoredCredentials: boolean
}

export function useCredentials(): UseCredentialsResult {
  const [credentials, setCredentials] = useState<Credentials>({
    tenant_id: "",
    apiKey: "",
    enterprise_id: "",
  })
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false)

  // Load credentials from localStorage on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem(CREDENTIALS_STORAGE_KEY)
    if (savedCredentials) {
      try {
        const parsedCredentials = JSON.parse(savedCredentials)
        setCredentials(parsedCredentials)
        setHasStoredCredentials(true)
      } catch (error) {
        console.error("Error parsing saved credentials:", error)
        localStorage.removeItem(CREDENTIALS_STORAGE_KEY)
      }
    }
  }, [])

  const updateCredentials = useCallback((newCredentials: Credentials) => {
    setCredentials(newCredentials)

    // Save to localStorage
    localStorage.setItem(
      CREDENTIALS_STORAGE_KEY,
      JSON.stringify(newCredentials),
    )
    setHasStoredCredentials(true)
  }, [])

  const clearStoredCredentials = useCallback(() => {
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY)
    setCredentials({ tenant_id: "", apiKey: "", enterprise_id: "" })
    setHasStoredCredentials(false)
  }, [])

  return {
    credentials,
    updateCredentials,
    clearStoredCredentials,
    hasStoredCredentials,
  }
}
