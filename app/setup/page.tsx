"use client"

import {
  CheckCircle,
  FileCheck,
  RotateCcw,
  Settings,
  Smartphone,
  Upload,
  AlertTriangle,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppStep } from "@/components/wizard/app-step"
import { DevicesStep } from "@/components/wizard/devices-step"
import { OptionsStep } from "@/components/wizard/options-step"
import { ResultsStep } from "@/components/wizard/results-step"
import { SummaryStep } from "@/components/wizard/summary-step"
import { useCredentials } from "@/hooks/use-credentials"
import { useDevices } from "@/hooks/use-esper-queries"
import type { EsperApplication, EsperDevice } from "@/lib/esper-api"

type WizardStep = "devices" | "app" | "options" | "summary" | "results"

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
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState<WizardStep>("devices")
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [selectedApplicationsData, setSelectedApplicationsData] = useState<
    Map<string, EsperApplication>
  >(new Map())
  const [selectedAppVersions, setSelectedAppVersions] = useState<
    Map<string, string>
  >(new Map())
  const [launchApps, setLaunchApps] = useState<string[]>([])
  const [rebootAfterDeploy, setRebootAfterDeploy] = useState<boolean>(false)
  const [results, setResults] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [shortcutBypass, setShortcutBypass] = useState(false)
  const [isCtrlAltPressed, setIsCtrlAltPressed] = useState(false)
  const [showShakeAnimation, setShowShakeAnimation] = useState(false)
  const [notConfirmed, setNotConfirmed] = useState<boolean | null>(null)
  const [isDeploymentComplete, setIsDeploymentComplete] = useState(false)
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)
  const [offlineDevices, setOfflineDevices] = useState<string[]>([])

  const {
    credentials,
    updateCredentials,
    clearStoredCredentials,
    hasStoredCredentials,
  } = useCredentials()
  const {
    data: devices = [],
    isLoading: loadingDevices,
    error: deviceError,
    refetch: refetchDevices,
  } = useDevices(credentials, hasStoredCredentials)

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

  // Handle URL parameters for pre-selecting devices
  useEffect(() => {
    if (!searchParams) return

    const deviceIds = searchParams.get("deviceIds")
    if (deviceIds) {
      const deviceIdArray = deviceIds.split(",").filter((id) => id.trim())
      if (deviceIdArray.length > 0) {
        setSelectedDevices(deviceIdArray)
        // If devices are pre-selected via URL, auto-advance to app step
        if (currentStep === "devices") {
          setCurrentStep("app")
        }
      }
    }
  }, [searchParams, currentStep])

  // Validate selected devices against available devices when devices are loaded
  useEffect(() => {
    if (devices.length > 0 && selectedDevices.length > 0) {
      const availableDeviceIds = devices.map((device) => device.id)
      const validSelectedDevices = selectedDevices.filter((id) =>
        availableDeviceIds.includes(id),
      )

      // Update selected devices to only include valid ones
      if (validSelectedDevices.length !== selectedDevices.length) {
        setSelectedDevices(validSelectedDevices)
      }
    }
  }, [devices, selectedDevices])

  // Auto-load devices when credentials are available (React Query handles this automatically)
  // No manual loading needed as the query will trigger when credentials change

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
    // Check for offline devices when leaving the devices step
    if (currentStep === "devices") {
      const offlineSelectedDevices = selectedDevices
        .map(deviceId => devices.find(d => d.id === deviceId))
        .filter((device): device is EsperDevice => {
          if (!device) return false
          if (!device.last_seen) return true

          const lastSeenTime = new Date(device.last_seen).getTime()
          const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000 // 30 minutes in milliseconds

          return lastSeenTime <= thirtyMinutesAgo
        })
        .map(device => device.name || "Unnamed Device")

      if (offlineSelectedDevices.length > 0) {
        setOfflineDevices(offlineSelectedDevices)
        setShowOfflineAlert(true)
        return
      }
    }

    const steps: WizardStep[] = [
      "devices",
      "app",
      "options",
      "summary",
      "results",
    ]
    const currentIndex = steps.indexOf(currentStep)

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const steps: WizardStep[] = [
      "devices",
      "app",
      "options",
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
      case "devices":
        return selectedDevices.length > 0
      case "app":
        return selectedApplications.length > 0
      case "options":
        return true // Options step is always considered complete
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

  // Handle proceeding with offline devices
  const handleProceedWithOffline = () => {
    setShowOfflineAlert(false)
    setOfflineDevices([])

    const steps: WizardStep[] = [
      "devices",
      "app",
      "options",
      "summary",
      "results",
    ]
    const currentIndex = steps.indexOf(currentStep)

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  // Handle canceling offline device selection
  const handleCancelOfflineSelection = () => {
    setShowOfflineAlert(false)
    setOfflineDevices([])
  }

  const stepConfig = [
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
      key: "options",
      title: "Options",
      icon: Settings,
      description: "Configure deployment options",
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
              {currentStep === "devices" && (
                <>
                  {(!credentials.tenant_id ||
                    !credentials.apiKey ||
                    !credentials.enterprise_id) && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-amber-800">
                            Credentials Required
                          </h3>
                          <div className="mt-2 text-sm text-amber-700">
                            <p>
                              Please configure your Esper API credentials in the{" "}
                              <a
                                href="/settings"
                                className="font-medium underline hover:text-amber-600"
                              >
                                Settings
                              </a>{" "}
                              page before proceeding with device selection.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <DevicesStep
                    devices={devices}
                    selectedDevices={selectedDevices}
                    onDeviceToggle={handleDeviceToggle}
                    loading={loadingDevices}
                    error={deviceError?.message || ""}
                    onRetry={() => refetchDevices()}
                  />
                </>
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
              {currentStep === "options" && (
                <OptionsStep
                  selectedDevices={selectedDevices}
                  devices={devices}
                  rebootAfterDeploy={rebootAfterDeploy}
                  onRebootAfterDeployChange={setRebootAfterDeploy}
                />
              )}
              {currentStep === "summary" && (
                <SummaryStep
                  credentials={credentials}
                  selectedDevices={selectedDevices}
                  devices={devices}
                  selectedApplications={selectedApplications}
                  launchApps={launchApps}
                  rebootAfterDeploy={rebootAfterDeploy}
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
                  rebootAfterDeploy={rebootAfterDeploy}
                  onDeploymentComplete={setIsDeploymentComplete}
                />
              )}
            </CardContent>
          </Card>

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <Button
              onClick={handleBack}
              disabled={
                currentStep === "devices" ||
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
                  setCurrentStep("devices")
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

      {/* Offline Device Alert Dialog */}
      <AlertDialog open={showOfflineAlert} onOpenChange={setShowOfflineAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <AlertDialogTitle>Offline Devices Detected</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              The following devices haven't been seen in the last 30 minutes and may be offline:
              <br /><br />
              <ul className="list-disc list-inside text-sm text-gray-600">
                {offlineDevices.map((deviceName, index) => (
                  <li key={index}>{deviceName}</li>
                ))}
              </ul>
              <br />
              Deploying to offline devices may fail or cause unexpected behavior.
              Do you want to proceed anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelOfflineSelection}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProceedWithOffline}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Proceed Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
