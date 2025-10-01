"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Loader2, XCircle, Eye, EyeOff } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCredentials } from "@/hooks/use-credentials"
import { esperApiService } from "@/lib/esper-api"

interface ValidationResult {
  isValid: boolean
  message: string
  companyName?: string
}

export function CredentialsForm() {
  const {
    credentials,
    updateCredentials,
    clearStoredCredentials,
    hasStoredCredentials,
  } = useCredentials()
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const [formData, setFormData] = useState({
    tenant_id: credentials.tenant_id,
    apiKey: credentials.apiKey,
    enterprise_id: credentials.enterprise_id,
  })

  // Update form data when credentials are loaded from localStorage
  useEffect(() => {
    setFormData({
      tenant_id: credentials.tenant_id,
      apiKey: credentials.apiKey,
      enterprise_id: credentials.enterprise_id,
    })
  }, [credentials])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear validation result when credentials change
    setValidationResult(null)
  }

  const handleValidateCredentials = async () => {
    if (!formData.tenant_id || !formData.apiKey || !formData.enterprise_id) {
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
        await esperApiService.validateCredentials(formData)
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

  const handleSaveCredentials = async () => {
    if (!validationResult?.isValid) {
      setValidationResult({
        isValid: false,
        message: "Please validate credentials first",
      })
      return
    }

    setIsSaving(true)

    try {
      // Save credentials (already validated)
      updateCredentials(formData)

      setValidationResult({
        isValid: true,
        message: "Credentials saved successfully!",
        companyName: validationResult.companyName,
      })
    } catch (error) {
      setValidationResult({
        isValid: false,
        message:
          error instanceof Error ? error.message : "Failed to save credentials",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearCredentials = () => {
    clearStoredCredentials()
    setFormData({
      tenant_id: "",
      apiKey: "",
      enterprise_id: "",
    })
    setValidationResult(null)
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
          value={formData.tenant_id}
          onChange={(e) => handleInputChange("tenant_id", e.target.value)}
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
        <div className="relative">
          <Input
            id="apiKey"
            type={showApiKey ? "text" : "password"}
            value={formData.apiKey}
            onChange={(e) => handleInputChange("apiKey", e.target.value)}
            placeholder="Enter API key"
            className="border-gray-200 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            {showApiKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
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
          value={formData.enterprise_id}
          onChange={(e) => handleInputChange("enterprise_id", e.target.value)}
          placeholder="Enter enterprise ID"
          className="border-gray-200"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          type="button"
          onClick={handleValidateCredentials}
          disabled={
            isValidating ||
            isSaving ||
            !formData.tenant_id ||
            !formData.apiKey ||
            !formData.enterprise_id
          }
          variant="outline"
          className="flex-1"
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            "Validate Credentials"
          )}
        </Button>

        <Button
          type="button"
          onClick={handleSaveCredentials}
          disabled={isValidating || isSaving || !validationResult?.isValid}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Credentials"
          )}
        </Button>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <Alert variant={validationResult.isValid ? "default" : "destructive"}>
          {validationResult.isValid ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>{validationResult.message}</AlertTitle>
          {validationResult.companyName && (
            <AlertDescription>
              Connected to: {validationResult.companyName}
            </AlertDescription>
          )}
        </Alert>
      )}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Credentials are stored locally in your browser. We do not share or
            store this information on our servers.
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearCredentials}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Saved Credentials
          </Button>
        </div>
      </div>
    </div>
  )
}
