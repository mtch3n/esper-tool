"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Smartphone,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useCredentials } from "@/hooks/use-credentials"
import { useDevices } from "@/hooks/use-esper-queries"
import {
  getLatestDeviceScreenshot,
  type EsperScreenshot,
  type EsperDevice,
} from "@/lib/esper-api"

interface DeviceScreenshotData {
  device: EsperDevice
  screenshot: EsperScreenshot | null
  status: "loading" | "success" | "failed" | "review"
  userDecision?: "success" | "failed"
}

export default function ScreenshotReviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { credentials } = useCredentials()

  // Fetch devices using React Query
  const { data: devicesData } = useDevices(
    credentials,
    !!credentials.tenant_id && !!credentials.apiKey && !!credentials.enterprise_id
  )

  const [deviceScreenshots, setDeviceScreenshots] = useState<
    DeviceScreenshotData[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [failedDevices, setFailedDevices] = useState<string[]>([])
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    deviceName: string
  } | null>(null)

  // Parse device IDs from URL params
  useEffect(() => {
    const deviceIds = searchParams.get("devices")?.split(",") || []

    if (deviceIds.length === 0) {
      setError("No devices specified")
      setLoading(false)
      return
    }

    // Wait for devices data to be loaded
    if (!devicesData) {
      return
    }

    // Initialize device screenshot data with actual device info from React Query
    const initialData: DeviceScreenshotData[] = deviceIds.map((deviceId) => {
      // Find the actual device data from React Query
      const actualDevice = devicesData.find((device) => device.id === deviceId)

      const device = actualDevice ? {
        ...actualDevice,
        id: actualDevice.id,
        name: actualDevice.name,
        alias: actualDevice.alias || "",
      } : {
        id: deviceId,
        name: `Device ${deviceId.slice(-4)}`,
        alias: "",
      } as EsperDevice

      return {
        device,
        screenshot: null,
        status: "loading",
      }
    })

    setDeviceScreenshots(initialData)
    loadScreenshots(initialData)
  }, [searchParams, credentials, devicesData])

  const loadScreenshots = async (devices: DeviceScreenshotData[]) => {
    if (!credentials) {
      setError("No credentials available")
      setLoading(false)
      return
    }

    try {
      const updatedDevices = await Promise.all(
        devices.map(async (deviceData) => {
          try {
            const screenshot = await getLatestDeviceScreenshot(
              credentials,
              deviceData.device.id,
            )

            return {
              ...deviceData,
              screenshot,
              status: screenshot ? ("review" as const) : ("failed" as const),
            }
          } catch (error) {
            return {
              ...deviceData,
              screenshot: null,
              status: "failed" as const,
            }
          }
        }),
      )

      setDeviceScreenshots(updatedDevices)
    } catch (error) {
      setError("Failed to load screenshots")
    } finally {
      setLoading(false)
    }
  }

  const handleDeviceDecision = (
    deviceId: string,
    decision: "success" | "failed",
  ) => {
    setDeviceScreenshots((prev) =>
      prev.map((device) =>
        device.device.id === deviceId
          ? { ...device, userDecision: decision }
          : device,
      ),
    )

    // Update failed devices list
    if (decision === "failed") {
      setFailedDevices((prev) =>
        prev.includes(deviceId) ? prev : [...prev, deviceId],
      )
    } else {
      setFailedDevices((prev) => prev.filter((id) => id !== deviceId))
    }
  }

  const handleRetryDeployment = () => {
    if (failedDevices.length === 0) {
      alert("No failed devices to retry")
      return
    }

    // Navigate back to wizard with failed device IDs
    const failedDevicesParam = failedDevices.join(",")
    router.push(`/setup?deviceIds=${failedDevicesParam}`)
  }

  const handleGoBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p>Loading screenshots...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const reviewCount = deviceScreenshots.filter(
    (d) => d.status === "review",
  ).length
  const decidedCount = deviceScreenshots.filter((d) => d.userDecision).length
  const successCount = deviceScreenshots.filter(
    (d) => d.userDecision === "success",
  ).length
  const failedCount = deviceScreenshots.filter(
    (d) => d.userDecision === "failed",
  ).length

  // Check if all devices are reviewed and accepted
  const allReviewed = deviceScreenshots.length > 0 && deviceScreenshots.every(device => device.userDecision)
  const allAccepted = allReviewed && deviceScreenshots.every(device => device.userDecision === "success")

  const handleCompleteReview = () => {
    router.push("/devices")
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Screenshot Review</h1>
          </div>
          <div className="flex items-center gap-3">
            {allAccepted && (
              <Button onClick={handleCompleteReview} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Review
              </Button>
            )}
            {failedDevices.length > 0 && (
              <Button onClick={handleRetryDeployment} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Deployment ({failedDevices.length} devices)
              </Button>
            )}
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {/* Summary */}
        <Collapsible
          open={isSummaryExpanded}
          onOpenChange={setIsSummaryExpanded}
        >
          <div className="mb-4">
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between rounded px-2 py-2 transition-colors hover:bg-gray-50">
                <h2 className="text-sm font-medium text-gray-900">Summary</h2>
                {isSummaryExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-4">
                <Card className="border shadow-sm">
                  <CardContent className="p-3 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {deviceScreenshots.length}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardContent className="p-3 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {successCount}
                    </div>
                    <div className="text-xs text-gray-500">Success</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardContent className="p-3 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {failedCount}
                    </div>
                    <div className="text-xs text-gray-500">Failed</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardContent className="p-3 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {reviewCount - decidedCount}
                    </div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </CardContent>
                </Card>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Screenshots Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deviceScreenshots.map((deviceData) => (
          <Card key={deviceData.device.id} className="overflow-hidden max-h-[600px] flex flex-col">
            {/* Header */}
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <CardTitle className="truncate text-base">
                  {deviceData.device.name}
                </CardTitle>
                {deviceData.userDecision ? (
                  <div
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      deviceData.userDecision === "success"
                        ? "border border-green-200 bg-green-50 text-green-700"
                        : "border border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {deviceData.userDecision === "success" ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <XCircle className="mr-1 h-3 w-3" />
                    )}
                    {deviceData.userDecision === "success"
                      ? "Success"
                      : "Failed"}
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </div>
                )}
              </div>
            </CardHeader>

            {/* Screenshot Content */}
            <CardContent className="flex-1 flex flex-col min-h-0">
              {deviceData.status === "failed" || !deviceData.screenshot ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 min-h-[200px]">
                  <div className="text-center text-gray-400">
                    <XCircle className="mx-auto mb-2 h-6 w-6" />
                    <p className="text-sm">No screenshot available</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 flex-1 flex flex-col">
                  <div
                    className="flex-1 cursor-pointer overflow-hidden rounded-lg border bg-gray-50 transition-opacity hover:opacity-90 min-h-[200px] max-h-[400px]"
                    onClick={() =>
                      deviceData.screenshot &&
                      setSelectedImage({
                        url: deviceData.screenshot.image_file,
                        deviceName: deviceData.device.name,
                      })
                    }
                  >
                    <img
                      src={deviceData.screenshot.image_file}
                      alt={`Screenshot for ${deviceData.device.name}`}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (
                          deviceData.screenshot?.thumbnail &&
                          target.src !== deviceData.screenshot.thumbnail
                        ) {
                          target.src = deviceData.screenshot.thumbnail
                        }
                      }}
                    />
                  </div>

                  <div className="flex-shrink-0">
                    {deviceData.screenshot.created_on && (
                      <p className="text-center text-xs text-gray-400">
                        {new Date(
                          deviceData.screenshot.created_on,
                        ).toLocaleString()}
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() =>
                        handleDeviceDecision(deviceData.device.id, "success")
                      }
                      variant={
                        deviceData.userDecision === "success"
                          ? "default"
                          : "outline"
                      }
                      className="h-8 flex-1 text-xs"
                      size="sm"
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Accept
                    </Button>
                    <Button
                      onClick={() =>
                        handleDeviceDecision(deviceData.device.id, "failed")
                      }
                      variant={
                        deviceData.userDecision === "failed"
                          ? "default"
                          : "outline"
                      }
                      className="h-8 flex-1 text-xs"
                      size="sm"
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col"
          onClick={() => setSelectedImage(null)}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 text-white">
            <h2 className="text-xl font-semibold">{selectedImage.deviceName}</h2>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-white hover:text-gray-300 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Image Container */}
          <div
            className="flex-1 flex items-center justify-center p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={`Screenshot for ${selectedImage.deviceName}`}
              className="max-w-[95vw] max-h-[calc(95vh-100px)] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
