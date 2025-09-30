"use client"

import { AlertCircle, Lock, Rocket } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const HARDCODED_ACCESS_CODE = "K-16332509"

export default function HomePage() {
  const [accessCode, setAccessCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate a brief loading state
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (accessCode === HARDCODED_ACCESS_CODE) {
      router.push("/setup")
    } else {
      setError("Invalid access code. Please try again.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Rocket className="h-5 w-5 text-gray-900" />
              <span className="text-lg font-medium text-gray-900">
                Esper Setup Tool
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div
        className="flex items-center justify-center p-6"
        style={{ minHeight: "calc(100vh - 73px)" }}
      >
        <div className="w-full max-w-md">
          <Card className="border border-gray-200">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="text-lg font-medium text-gray-900" />
              <div className="mb-4 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Lock className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text text-gray-500">
                  Enter your access code to continue
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    id="access-code"
                    type="text"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value)
                      setError("")
                    }}
                    placeholder="Enter access code"
                    className="border-gray-200 font-mono"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={!accessCode.trim() || isLoading}
                  className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300"
                >
                  {isLoading ? "Verifying..." : "Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Contact your administrator if you need access
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
