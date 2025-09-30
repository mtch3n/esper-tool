import { useState, useCallback } from "react"
import {
  esperApiService,
  type EsperCredentials,
  type EsperAppUploadResponse,
} from "@/lib/esper-api"

interface UseAppUploadResult {
  uploading: boolean
  error: string
  uploadResult: EsperAppUploadResponse | null
  uploadApp: (credentials: EsperCredentials, file: File) => Promise<void>
  clearError: () => void
  clearResult: () => void
}

export function useAppUpload(): UseAppUploadResult {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [uploadResult, setUploadResult] =
    useState<EsperAppUploadResponse | null>(null)

  const clearError = useCallback(() => {
    setError("")
  }, [])

  const clearResult = useCallback(() => {
    setUploadResult(null)
  }, [])

  const uploadApp = useCallback(
    async (credentials: EsperCredentials, file: File) => {
      setUploading(true)
      setError("")
      setUploadResult(null)

      try {
        const result = await esperApiService.uploadApp(credentials, file)
        setUploadResult(result)
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to upload app",
        )
      } finally {
        setUploading(false)
      }
    },
    [],
  )

  return {
    uploading,
    error,
    uploadResult,
    uploadApp,
    clearError,
    clearResult,
  }
}
