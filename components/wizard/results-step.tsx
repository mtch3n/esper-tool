import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  getCommandStatus,
  type EsperCommandResponse,
  type EsperCommandStatus,
  type EsperCredentials,
} from "@/lib/esper-api"

import {
  executeDistributeStep,
  executeVerifyStep,
  executeEnableStep,
  executeValidateStep,
  executeLaunchStep,
  executeRebootStep,
  executeScreenshotStep,
  executeLauncherStep,
  type StepContext,
} from "./results-steps"

import {
  ResultsHeader,
  DeviceCard,
  StepDeviceStatusDisplay,
  StepErrorDisplay,
  type DeploymentStep,
} from "./detail-cards"

interface ResultsStepProps {
  selectedDevices: string[]
  selectedApplications: string[]
  selectedAppVersions?: Map<string, string> // appId -> versionId
  selectedApplicationsData?: Map<
    string,
    { package_name: string; application_name: string }
  > // appId -> app info
  launchApps: string[]
  devices: any[]
  credentials: EsperCredentials
  rebootAfterDeploy?: boolean
  onDeploymentComplete: (completed: boolean) => void
}

export function ResultsStep({
  selectedDevices,
  selectedApplications,
  selectedAppVersions,
  selectedApplicationsData,
  launchApps,
  devices,
  credentials,
  rebootAfterDeploy = false,
  onDeploymentComplete,
}: ResultsStepProps) {
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([
    {
      id: "distribute",
      title: `Distributing to ${selectedDevices.length} device(s)`,
      status: "pending",
    },
    {
      id: "verify",
      title: "Verifying installation status",
      status: "pending",
    },
    {
      id: "enable",
      title: "Enabling installed apps",
      status: "pending",
    },
    {
      id: "validate",
      title: "Validating app presence on devices",
      status: "pending",
    },
    ...(launchApps.length > 0
      ? [
          {
            id: "launch",
            title: `Launching ${launchApps.length} app(s)`,
            status: "pending" as const,
          },
        ]
      : []),
    ...(launchApps.length > 0
      ? [
          {
            id: "screenshot",
            title: `Capturing screenshots on ${selectedDevices.length} device(s)`,
            status: "pending" as const,
          },
          {
            id: "launcher",
            title: `Launching Esper Launcher on ${selectedDevices.length} device(s)`,
            status: "pending" as const,
          },
        ]
      : []),
    ...(rebootAfterDeploy
      ? [
          {
            id: "reboot",
            title: `Rebooting ${selectedDevices.length} device(s)`,
            status: "pending" as const,
          },
        ]
      : []),
  ])

  const [isComplete, setIsComplete] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [commandResponses, setCommandResponses] = useState<
    EsperCommandResponse[]
  >([])
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  const router = useRouter()

  // Reset deployment state when component mounts (new deployment starts)
  useEffect(() => {
    onDeploymentComplete(false)
  }, [])

  // Helper function to update step state
  const updateStepState = (
    stepIndex: number,
    updates: Partial<DeploymentStep>,
  ) => {
    setDeploymentSteps((prev) => {
      const updated = [...prev]
      updated[stepIndex] = {
        ...updated[stepIndex],
        ...updates,
      }
      return updated
    })
  }

  // Helper function to update device status for a step
  const updateStepDeviceStatus = (
    stepIndex: number,
    deviceStatuses: Map<string, EsperCommandStatus>,
  ) => {
    const summary = {
      successful: Array.from(deviceStatuses.values()).filter(
        (s) => s.state === "Command Success",
      ).length,
      failed: Array.from(deviceStatuses.values()).filter(
        (s) => s.state === "Command Failure",
      ).length,
      inProgress: Array.from(deviceStatuses.values()).filter(
        (s) => !["Command Success", "Command Failure"].includes(s.state),
      ).length,
    }

    updateStepState(stepIndex, {
      deviceStatus: {
        deviceStatuses,
        summary,
      },
    })
  }

  // Helper functions for step display
  const getStepIcon = (status: DeploymentStep["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-gray-400" />
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getStepBadge = (status: DeploymentStep["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
    }
  }

  // Real deployment implementation using Esper API
  useEffect(() => {
    if (hasFailed || isComplete) return

    const executeDeploymentStep = async (stepIndex: number) => {
      const step = deploymentSteps[stepIndex]
      if (!step) return

      try {
        // Mark step as running
        updateStepState(stepIndex, {
          status: "running",
          timestamp: new Date().toLocaleTimeString(),
        })

        // Create step context for modular functions
        const stepContext: StepContext = {
          selectedDevices,
          selectedApplications,
          selectedAppVersions,
          selectedApplicationsData,
          credentials,
          commandResponses,
          setCommandResponses,
        }

        let stepResult: string
        let stepSuccess = true

        // Execute step using modular functions
        switch (step.id) {
          case "distribute": {
            const result = await executeDistributeStep(stepContext)
            stepResult = result.message
            stepSuccess = result.success
            if (!result.success && result.error) {
              throw result.error
            }
            break
          }
          case "verify": {
            const result = await executeVerifyStep(
              stepContext,
              (deviceStatuses) =>
                updateStepDeviceStatus(stepIndex, deviceStatuses),
            )
            stepResult = result.message
            stepSuccess = result.success
            if (!result.success && result.error) {
              throw result.error
            }
            break
          }
          case "enable": {
            const result = await executeEnableStep(stepContext)
            stepResult = result.message
            stepSuccess = result.success
            if (!result.success && result.error) {
              throw result.error
            }
            break
          }
          case "validate": {
            const result = await executeValidateStep(stepContext)
            stepResult = result.message
            stepSuccess = result.success
            if (!result.success && result.error) {
              throw result.error
            }
            break
          }
          case "launch": {
            const result = await executeLaunchStep(stepContext, launchApps)
            stepResult = result.message
            stepSuccess = result.success
            if (!result.success && result.error) {
              throw result.error
            }
            break
          }
          case "screenshot": {
            const result = await executeScreenshotStep(
              stepContext,
              (deviceStatuses) =>
                updateStepDeviceStatus(stepIndex, deviceStatuses),
            )
            stepResult = result.message
            stepSuccess = result.success
            if (!result.success && result.error) {
              throw result.error
            }
            break
          }
          case "launcher": {
            const result = await executeLauncherStep(stepContext)
            stepResult = result.message
            stepSuccess = result.success
            if (!result.success && result.error) {
              throw result.error
            }
            break
          }
          case "reboot": {
            const result = await executeRebootStep(stepContext)
            stepResult = result.message
            stepSuccess = result.success
            if (!result.success && result.error) {
              throw result.error
            }
            break
          }
          default:
            stepResult = "Step completed"
        }

        // Mark step as completed
        updateStepState(stepIndex, {
          status: "completed",
          details: stepResult,
        })

        // Move to next step or complete
        if (stepIndex < deploymentSteps.length - 1) {
          setTimeout(() => {
            setCurrentStepIndex(stepIndex + 1)
          }, 1000)
        } else {
          setIsComplete(true)
          onDeploymentComplete(true)
        }
      } catch (error) {
        console.error(`Step ${step.id} failed:`, error)

        // Extract detailed error information if available
        let fullErrorDetails = ""
        let errorMessage = "Step failed"

        if (error instanceof Error) {
          errorMessage = error.message

          // Check if this is our enhanced error with details
          if ((error as any).details) {
            const details = (error as any).details
            fullErrorDetails = JSON.stringify(details, null, 2)
          } else {
            // Fall back to stack trace
            fullErrorDetails = error.stack || error.message
          }
        } else {
          // Handle non-Error objects
          fullErrorDetails = JSON.stringify(error, null, 2)
          errorMessage = "Unknown error occurred"
        }

        // Mark step as failed
        updateStepState(stepIndex, {
          status: "failed",
          details: errorMessage,
          error: {
            message: errorMessage,
            technicalDetails: fullErrorDetails,
            isExpanded: false,
          },
        })

        setHasFailed(true)
      }
    }

    // Execute current step
    if (currentStepIndex < deploymentSteps.length) {
      const timeoutId = setTimeout(() => {
        executeDeploymentStep(currentStepIndex)
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [
    currentStepIndex,
    hasFailed,
    isComplete,
    selectedDevices,
    selectedApplications,
    launchApps,
    rebootAfterDeploy,
    credentials,
  ])

  // Handler functions for child components
  const handleToggleStepExpansion = (stepId: string) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(stepId)) {
        newSet.delete(stepId)
      } else {
        newSet.add(stepId)
      }
      return newSet
    })
  }

  const handleStepRetry = (index: number) => {
    // Reset the failed step and continue from there
    updateStepState(index, {
      status: "pending",
      timestamp: undefined,
      details: undefined,
      error: undefined,
      deviceStatus: undefined,
    })
    setCurrentStepIndex(index)
    setHasFailed(false)
  }

  const handleToggleErrorExpansion = (stepId: string) => {
    const stepIndex = deploymentSteps.findIndex((step) => step.id === stepId)
    if (stepIndex !== -1 && deploymentSteps[stepIndex].error) {
      updateStepState(stepIndex, {
        error: {
          ...deploymentSteps[stepIndex].error!,
          isExpanded: !deploymentSteps[stepIndex].error!.isExpanded,
        },
      })
    }
  }

  const handleToggleDeviceExpansion = (deviceId: string) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev)
      const deviceKey = `device-${deviceId}`
      if (newSet.has(deviceKey)) {
        newSet.delete(deviceKey)
      } else {
        newSet.add(deviceKey)
      }
      return newSet
    })
  }

  const handleViewScreenshots = () => {
    // Navigate to screenshot review page with device IDs only
    const deviceIds = selectedDevices.join(",")
    router.push(`/screenshot-review?devices=${deviceIds}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResultsHeader
        isComplete={isComplete}
        hasFailed={hasFailed}
        selectedDevices={selectedDevices}
        devices={devices}
        onViewScreenshots={handleViewScreenshots}
      />

      {/* Tabs for Deployment Steps and Device Status */}
      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="steps">Deployment Steps</TabsTrigger>
          <TabsTrigger value="devices">Device Status</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="mt-6 space-y-4">
          <div className="space-y-3">
            {deploymentSteps.map((step, index) => {
              const isCanceled =
                step.status === "pending" &&
                index > currentStepIndex &&
                hasFailed

              const isExpanded = expandedSteps.has(step.id)

              const handleToggleExpansion = () => {
                handleToggleStepExpansion(step.id)
              }

              const handleRetry = () => {
                handleStepRetry(index)
              }

              const handleStepToggleErrorExpansion = () => {
                handleToggleErrorExpansion(step.id)
              }

              return (
                <Collapsible
                  key={step.id}
                  open={isExpanded}
                  onOpenChange={handleToggleExpansion}
                >
                  <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          {isCanceled ? (
                            <AlertCircle className="h-5 w-5 text-gray-400" />
                          ) : (
                            getStepIcon(step.status)
                          )}
                          <div className="text-left">
                            <h3 className="font-medium text-gray-900">
                              {step.title}
                            </h3>
                            {step.timestamp && (
                              <p className="text-sm text-gray-500">
                                Started at {step.timestamp}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isCanceled ? (
                            <Badge
                              variant="secondary"
                              className="bg-gray-200 text-gray-600"
                            >
                              Canceled
                            </Badge>
                          ) : (
                            getStepBadge(step.status)
                          )}
                          {step.status === "failed" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRetry()
                              }}
                              className="inline-flex items-center rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                            >
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Retry
                            </button>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t border-gray-100 px-4 pt-3 pb-4">
                        {/* Step Details */}
                        {step.details && (
                          <div className="mb-3">
                            <h4 className="mb-1 text-sm font-medium text-gray-700">
                              Details
                            </h4>
                            <p className="text-sm text-gray-600">
                              {step.details}
                            </p>
                          </div>
                        )}

                        {/* Device Status - now part of step state */}
                        {step.deviceStatus && (
                          <StepDeviceStatusDisplay
                            deviceStatus={step.deviceStatus}
                            devices={devices}
                          />
                        )}

                        {/* Canceled Status */}
                        {isCanceled && (
                          <div className="mb-3">
                            <h4 className="mb-1 text-sm font-medium text-gray-700">
                              Status
                            </h4>
                            <p className="text-sm text-gray-500">
                              Canceled due to previous step failure
                            </p>
                          </div>
                        )}

                        {/* Error Display - now part of step state */}
                        {step.error && (
                          <StepErrorDisplay
                            error={step.error}
                            stepId={step.id}
                            onToggleExpansion={handleStepToggleErrorExpansion}
                          />
                        )}

                        {/* Expected Output */}
                        {!step.details &&
                          !isCanceled &&
                          step.status !== "failed" && (
                            <div>
                              <h4 className="mb-1 text-sm font-medium text-gray-700">
                                Expected Output
                              </h4>
                              <p className="text-sm text-gray-600">
                                {step.expectedOutput ||
                                  (step.status === "completed"
                                    ? "Step completed successfully"
                                    : step.status === "running"
                                      ? `Currently ${step.id}ing...`
                                      : "Waiting to start...")}
                              </p>
                            </div>
                          )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="devices" className="mt-6 space-y-4">
          {!isComplete && !hasFailed ? (
            <Alert variant="info">
              <Clock />
              <AlertTitle>Waiting for Deployment</AlertTitle>
              <AlertDescription>
                Device status will be available once deployment is complete.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {selectedDevices.slice(0, 10).map((deviceId, index) => {
                const device = devices.find((d) => d.id === deviceId)
                const deviceFailed = hasFailed && index % 3 === 0 // Fallback to simulation
                const isExpanded = expandedSteps.has(`device-${deviceId}`)

                const handleToggleExpansion = () => {
                  handleToggleDeviceExpansion(deviceId)
                }

                return (
                  <DeviceCard
                    key={deviceId}
                    deviceId={deviceId}
                    device={device}
                    isExpanded={isExpanded}
                    launchApps={launchApps}
                    onToggleExpansion={handleToggleExpansion}
                    variant={deviceFailed ? "failed" : "success"}
                    deviceStatus={undefined}
                  />
                )
              })}
              {selectedDevices.length > 10 && (
                <p className="text-center text-sm text-gray-500">
                  ... and {selectedDevices.length - 10} more device(s)
                </p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
