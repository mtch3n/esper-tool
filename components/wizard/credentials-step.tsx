import { CheckCircle, Loader2, XCircle } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { esperApiService } from "@/lib/esper-api"

interface Credentials {
  tenant_id: string
  apiKey: string
  enterprise_id: string
}

interface CredentialsStepProps {
  credentials: Credentials
  onUpdate: (credentials: Credentials) => void
  onClearStored: () => void
  hasStoredCredentials: boolean
}

export function CredentialsStep({
  credentials,
  onUpdate,
  onClearStored,
  hasStoredCredentials,
}: CredentialsStepProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    message: string
    companyName?: string
  } | null>(null)

  const handleValidateCredentials = async () => {
    if (
      !credentials.tenant_id ||
      !credentials.apiKey ||
      !credentials.enterprise_id
    ) {
      setValidationResult({
        isValid: false,
        message: "Please fill in all credential fields",
      })
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const companySettings =
        await esperApiService.validateCredentials(credentials)
      setValidationResult({
        isValid: true,
        message: "Credentials are valid!",
        companyName: companySettings.name,
      })
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: error instanceof Error ? error.message : "Validation failed",
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="tenant_id"
          className="mb-1 block text-sm font-medium text-gray-900"
        >
          Tenant ID
        </Label>
        <Input
          id="tenant_id"
          value={credentials.tenant_id}
          onChange={(e) => {
            onUpdate({
              ...credentials,
              tenant_id: e.target.value,
            })
            // Clear validation result when credentials change
            setValidationResult(null)
          }}
          placeholder="Enter tenant ID"
          className="border-gray-200"
        />
      </div>
      <div>
        <Label
          htmlFor="apiKey"
          className="mb-1 block text-sm font-medium text-gray-900"
        >
          API Key
        </Label>
        <Input
          id="apiKey"
          type="password"
          value={credentials.apiKey}
          onChange={(e) => {
            onUpdate({
              ...credentials,
              apiKey: e.target.value,
            })
            // Clear validation result when credentials change
            setValidationResult(null)
          }}
          placeholder="Enter API key"
          className="border-gray-200"
        />
      </div>
      <div>
        <Label
          htmlFor="enterprise_id"
          className="mb-1 block text-sm font-medium text-gray-900"
        >
          Enterprise ID
        </Label>
        <Input
          id="enterprise_id"
          value={credentials.enterprise_id}
          onChange={(e) => {
            onUpdate({
              ...credentials,
              enterprise_id: e.target.value,
            })
            // Clear validation result when credentials change
            setValidationResult(null)
          }}
          placeholder="Enter enterprise ID"
          className="border-gray-200"
        />
      </div>

      {/* Validation Button and Results */}
      <div className="space-y-3">
        <Button
          type="button"
          onClick={handleValidateCredentials}
          disabled={
            isValidating ||
            !credentials.tenant_id ||
            !credentials.apiKey ||
            !credentials.enterprise_id
          }
          className="w-full"
          variant="outline"
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            "Check Credentials"
          )}
        </Button>

        {validationResult && (
          <Alert variant={validationResult.isValid ? "success" : "destructive"}>
            {validationResult.isValid ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{validationResult.message}</AlertTitle>
            {validationResult.companyName && (
              <AlertDescription>
                {validationResult.companyName}
              </AlertDescription>
            )}
          </Alert>
        )}
      </div>

      {hasStoredCredentials && (
        <div className="border-t border-gray-100 pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Credentials are stored locally. We will not share or store this
                information.
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearStored}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear Saved Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
