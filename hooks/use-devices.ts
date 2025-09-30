import { useState, useCallback } from "react"
import {
  esperApiService,
  type EsperDevice,
  type EsperCredentials,
} from "@/lib/esper-api"

interface UseDevicesResult {
  devices: EsperDevice[]
  loading: boolean
  error: string
  loadDevices: (credentials: EsperCredentials) => Promise<void>
  clearError: () => void
}

export function useDevices(): UseDevicesResult {
  const [devices, setDevices] = useState<EsperDevice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const clearError = useCallback(() => {
    setError("")
  }, [])

  const loadDevices = useCallback(async (credentials: EsperCredentials) => {
    if (!credentials.apiKey || !credentials.tenant_id) {
      setError("Please enter valid credentials first")
      return
    }

    setLoading(true)
    setError("")

    try {
      const deviceList = await esperApiService.getDevices(credentials)
      setDevices(deviceList)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load devices",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    devices,
    loading,
    error,
    loadDevices,
    clearError,
  }
}
