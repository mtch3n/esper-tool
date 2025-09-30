"use client"

import {
  CheckCircle,
  FileCheck,
  Key,
  Rocket,
  RotateCcw,
  Smartphone,
  Upload,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppStep } from "@/components/wizard/app-step"
import { CredentialsStep } from "@/components/wizard/credentials-step"
import { DevicesStep } from "@/components/wizard/devices-step"
import { ResultsStep } from "@/components/wizard/results-step"
import { SummaryStep } from "@/components/wizard/summary-step"
import { useCredentials } from "@/hooks/use-credentials"
import { useDevices } from "@/hooks/use-devices"
import type { EsperApplication } from "@/lib/esper-api"

type WizardStep = "credentials" | "devices" | "app" | "summary" | "results"

interface WizardData {
  credentials: {
    tenant_id: string
    apiKey: string
    enterprise_id: string
  }
  selectedDevices: string[]
  selectedApplications: string[]
  results: string
}

export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("credentials")
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [selectedApplicationsData, setSelectedApplicationsData] = useState<
    Map<string, EsperApplication>
  >(new Map())
  const [selectedAppVersions, setSelectedAppVersions] = useState<
    Map<string, string>
  >(new Map())
  const [launchApps, setLaunchApps] = useState<string[]>([])
  const [results, setResults] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [shortcutBypass, setShortcutBypass] = useState(false)
  const [isCtrlAltPressed, setIsCtrlAltPressed] = useState(false)
  const [showShakeAnimation, setShowShakeAnimation] = useState(false)
  const [notConfirmed, setNotConfirmed] = useState<boolean | null>(null)
  const [isDeploymentComplete, setIsDeploymentComplete] = useState(false)

  const {
    credentials,
    updateCredentials,
    clearStoredCredentials,
    hasStoredCredentials,
  } = useCredentials()
  const {
    devices,
    loading: loadingDevices,
    error: deviceError,
    loadDevices,
    clearError,
  } = useDevices()

  // Listen for Ctrl+Alt key combinations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey) {
        setIsCtrlAltPressed(true)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.altKey) {
        setIsCtrlAltPressed(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  const handleDeviceToggle = (deviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedDevices((prev) => [...prev, deviceId])
    } else {
      setSelectedDevices((prev) => prev.filter((d) => d !== deviceId))
    }
  }

  const handleApplicationDataSelect = useCallback(
    (applicationsData: Map<string, EsperApplication>) => {
      setSelectedApplicationsData(applicationsData)
    },
    [],
  )

  const handleNext = async () => {
    const steps: WizardStep[] = [
      "credentials",
      "devices",
      "app",
      "summary",
      "results",
    ]
    const currentIndex = steps.indexOf(currentStep)

    if (currentStep === "credentials" && currentIndex < steps.length - 1) {
      // Load devices when moving from credentials to devices step
      setCurrentStep(steps[currentIndex + 1])
      await loadDevices(credentials)
    } else if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const steps: WizardStep[] = [
      "credentials",
      "devices",
      "app",
      "summary",
      "results",
    ]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleDeploy = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmDeploy = () => {
    if (confirmText === "CONFIRM" || shortcutBypass) {
      // Simulate deployment
      setResults("Deployment successful!")
      setCurrentStep("results")
      setShowConfirmDialog(false)
      setConfirmText("")
      setShortcutBypass(false)
      setNotConfirmed(null)
    } else {
      // Trigger shake animation and persistent red border
      setShowShakeAnimation(true)
      setNotConfirmed(true)
      setTimeout(() => setShowShakeAnimation(false), 500)
    }
  }

  const isStepComplete = () => {
    switch (currentStep) {
      case "credentials":
        return (
          credentials.tenant_id &&
          credentials.apiKey &&
          credentials.enterprise_id
        )
      case "devices":
        return selectedDevices.length > 0
      case "app":
        return selectedApplications.length > 0
      default:
        return true
    }
  }

  const handleCancelDeploy = () => {
    setShowConfirmDialog(false)
    setConfirmText("")
    setShortcutBypass(false)
    setShowShakeAnimation(false)
    setNotConfirmed(null)
  }

  const checkHasBypassKeyCombo = () => {
    console.log("Checking key combo:", isCtrlAltPressed)
    if (isCtrlAltPressed) {
      setShortcutBypass(true)
    }
  }

  const stepConfig = [
    {
      key: "credentials",
      title: "Credentials",
      icon: Key,
      description: "Enter your API credentials",
    },
    {
      key: "devices",
      title: "Devices",
      icon: Smartphone,
      description: "Select target devices",
    },
    {
      key: "app",
      title: "App",
      icon: Upload,
      description: "Choose app to deploy",
    },
    {
      key: "summary",
      title: "Summary",
      icon: FileCheck,
      description: "Review your selections",
    },
    {
      key: "results",
      title: "Results",
      icon: CheckCircle,
      description: "Deployment status",
    },
  ]

  const getCurrentStepIndex = () =>
    stepConfig.findIndex((step) => step.key === currentStep)

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

      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          {/* Simple Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8 pb-4">
              {stepConfig.map((step, index) => {
                const isActive = currentStep === step.key
                const isCompleted = getCurrentStepIndex() > index

                return (
                  <div key={step.key} className="flex items-center">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-all ${
                          isActive
                            ? "bg-gray-900 text-white"
                            : isCompleted
                              ? "bg-gray-900 text-white"
                              : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isCompleted && !isActive ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${isActive ? "text-gray-900" : "text-gray-400"}`}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < stepConfig.length - 1 && (
                      <div className="mx-4 h-px w-8 bg-gray-200" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Card className="border border-gray-200">
            <CardHeader className="border-gray-100">
              <CardTitle className="text-md font-medium text-gray-900">
                {stepConfig.find((step) => step.key === currentStep)?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStep === "credentials" && (
                <CredentialsStep
                  credentials={credentials}
                  onUpdate={updateCredentials}
                  onClearStored={clearStoredCredentials}
                  hasStoredCredentials={hasStoredCredentials}
                />
              )}{" "}
              {currentStep === "devices" && (
                <DevicesStep
                  devices={devices}
                  selectedDevices={selectedDevices}
                  onDeviceToggle={handleDeviceToggle}
                  loading={loadingDevices}
                  error={deviceError}
                  onRetry={() => loadDevices(credentials)}
                />
              )}{" "}
              {currentStep === "app" && (
                <AppStep
                  selectedApplications={selectedApplications}
                  launchApps={launchApps}
                  onApplicationsSelect={setSelectedApplications}
                  onLaunchAppsChange={setLaunchApps}
                  onAppVersionsSelect={setSelectedAppVersions}
                  onApplicationDataSelect={handleApplicationDataSelect}
                  credentials={credentials}
                />
              )}
              {currentStep === "summary" && (
                <SummaryStep
                  credentials={credentials}
                  selectedDevices={selectedDevices}
                  devices={devices}
                  selectedApplications={selectedApplications}
                  launchApps={launchApps}
                />
              )}
              {currentStep === "results" && (
                <ResultsStep
                  selectedDevices={selectedDevices}
                  selectedApplications={selectedApplications}
                  selectedAppVersions={selectedAppVersions}
                  selectedApplicationsData={selectedApplicationsData}
                  launchApps={launchApps}
                  devices={devices}
                  credentials={credentials}
                  onDeploymentComplete={setIsDeploymentComplete}
                />
              )}
            </CardContent>
          </Card>

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <Button
              onClick={handleBack}
              disabled={
                currentStep === "credentials" ||
                (currentStep === "results" && !isDeploymentComplete)
              }
              variant="ghost"
              className="text-gray-600"
            >
              Back
            </Button>

            {currentStep === "summary" ? (
              <Button
                onClick={handleDeploy}
                className="bg-gray-900 hover:bg-gray-800"
              >
                Deploy
              </Button>
            ) : currentStep === "results" ? (
              <Button
                onClick={() => {
                  setCurrentStep("credentials")
                  setIsDeploymentComplete(false)
                }}
                disabled={!isDeploymentComplete}
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepComplete()}
                className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Caution</DialogTitle>
            <DialogDescription>
              You are about to deploy {selectedApplications.length}{" "}
              application(s) to {selectedDevices.length} device(s).
              <br />
              This action cannot be undone and may take several minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="confirm-text" className="">
                Type "CONFIRM" to proceed:
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => {
                  const newValue = e.target.value
                  setConfirmText(newValue)
                  if (showShakeAnimation) {
                    setShowShakeAnimation(false)
                  }
                  // Show red border if user has attempted deploy and text is not "CONFIRM"
                  if (notConfirmed !== null) {
                    if (newValue === "CONFIRM") {
                      setNotConfirmed(false)
                    } else {
                      setNotConfirmed(true)
                    }
                  }
                }}
                placeholder='"CONFIRM"'
                className={`mt-2 ${
                  notConfirmed === true || showShakeAnimation
                    ? "border-red-500 focus:border-red-500"
                    : ""
                } ${
                  showShakeAnimation ? "animate-[shake_0.5s_ease-in-out]" : ""
                }`}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancelDeploy}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDeploy}
              onMouseEnter={checkHasBypassKeyCombo}
              onMouseLeave={() => setShortcutBypass(false)}
              className={`${
                confirmText === "CONFIRM" || shortcutBypass
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300"
              }`}
            >
              Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
