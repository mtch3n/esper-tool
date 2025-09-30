import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Smartphone,
} from "lucide-react"

// Android OS version to SDK API level mapping
const getAndroidSdkLevel = (osVersion: string): string => {
  const version = parseFloat(osVersion)
  const versionMap: Record<number, number> = {
    16: 36, // Android 16
    15: 35, // Android 15
    14: 34, // Android 14
    13: 33, // Android 13
    12.1: 32, // Android 12L
    12: 31, // Android 12
    11: 30, // Android 11
    10: 29, // Android 10
    9: 28, // Android 9
    8.1: 27, // Android 8.1
    8: 26, // Android 8.0
    7.1: 25, // Android 7.1
    7: 24, // Android 7.0
    6: 23, // Android 6
    5.1: 22, // Android 5.1
    5: 21, // Android 5.0
    4.4: 19, // Android 4.4
    4.3: 18, // Android 4.3
    4.2: 17, // Android 4.2
    4.1: 16, // Android 4.1
    4.0: 15, // Android 4.0.3-4.0.4
    3.2: 13, // Android 3.2
    3.1: 12, // Android 3.1
    3.0: 11, // Android 3.0
    2.3: 10, // Android 2.3.3+
    2.2: 8, // Android 2.2
    2.1: 7, // Android 2.1
    2.0: 6, // Android 2.0.1
    1.6: 4, // Android 1.6
    1.5: 3, // Android 1.5
    1.1: 2, // Android 1.1
    1.0: 1, // Android 1.0
  }

  // Find the closest match for the version
  const sdkLevel = versionMap[version] || versionMap[Math.floor(version)]
  return sdkLevel ? `${sdkLevel}` : "Unknown"
}

import { useState } from "react"

// Device status mapping
const DEVICE_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: "Unspecified", color: "bg-gray-300 text-gray-700" },
  1: { label: "Online", color: "bg-green-100 text-green-700" },
  20: { label: "Disabled", color: "bg-gray-200 text-gray-500" },
  30: { label: "Provisioning", color: "bg-yellow-100 text-yellow-700" },
  40: { label: "Configuring Play", color: "bg-yellow-100 text-yellow-700" },
  50: { label: "Applying Policies", color: "bg-yellow-100 text-yellow-700" },
  60: { label: "Offline", color: "bg-red-100 text-red-700" },
  70: { label: "Factory Resetting", color: "bg-orange-100 text-orange-700" },
  80: { label: "Onboarding", color: "bg-blue-100 text-blue-700" },
  90: { label: "Onboarding Failed", color: "bg-red-200 text-red-800" },
  100: { label: "Onboarded", color: "bg-green-50 text-green-800" },
  110: { label: "AFW Added", color: "bg-blue-50 text-blue-800" },
  120: { label: "Apps Installed", color: "bg-blue-50 text-blue-800" },
  130: { label: "Branding Processed", color: "bg-blue-50 text-blue-800" },
  140: { label: "Permission Policy", color: "bg-blue-50 text-blue-800" },
  150: { label: "Device Policy", color: "bg-blue-50 text-blue-800" },
  160: { label: "Settings Processed", color: "bg-blue-50 text-blue-800" },
  170: { label: "Security Policy", color: "bg-blue-50 text-blue-800" },
  180: { label: "Phone Policy", color: "bg-blue-50 text-blue-800" },
  190: { label: "Custom Settings", color: "bg-blue-50 text-blue-800" },
  200: { label: "Registered", color: "bg-green-50 text-green-800" },
}

function getDeviceStatusInfo(state: number) {
  return (
    DEVICE_STATUS_MAP[state] || {
      label: `Status ${state}`,
      color: "bg-gray-200 text-gray-500",
    }
  )
}

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EsperCredentials, EsperDevice } from "@/lib/esper-api"

interface DevicesStepProps {
  devices: EsperDevice[]
  selectedDevices: string[]
  onDeviceToggle: (deviceId: string, checked: boolean) => void
  loading: boolean
  error: string
  onRetry: () => void
}

export function DevicesStep({
  devices,
  selectedDevices,
  onDeviceToggle,
  loading,
  error,
  onRetry,
}: DevicesStepProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Helper function to check if device was seen within last 30 minutes
  const isDeviceRecentlySeen = (device: EsperDevice): boolean => {
    if (!device.last_seen) {
      return false // Hide devices without last_seen timestamp
    }

    const lastSeenTime = new Date(device.last_seen).getTime()
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000) // 30 minutes in milliseconds

    return lastSeenTime > thirtyMinutesAgo
  }

  const filteredDevices = devices.filter(
    (device) =>
      // Only show devices that were seen within the last 30 minutes
      isDeviceRecentlySeen(device) &&
      // AND match the search criteria
      (device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.alias?.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDevices = filteredDevices.slice(startIndex, endIndex)

  // Reset to first page when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          placeholder="Search devices..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border-gray-200 pl-10"
        />
      </div>

      <div className="space-y-1">
        <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            {selectedDevices.length} of {filteredDevices.length} devices
            selected
          </span>
          {totalPages > 1 && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        <div className="min-h-[320px] space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading devices...
            </div>
          ) : error ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Retry Loading Devices
              </Button>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Smartphone className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p>No devices found</p>
            </div>
          ) : (
            paginatedDevices.map((device) => {
              const deviceName = device.name || "Unnamed Device"
              const deviceAlias = device.alias

              // Dot color logic: green for 1, red for 60, yellow otherwise
              let dotColor = "bg-yellow-400"
              let statusLabel = "Unknown"
              if (device.state === 1) {
                dotColor = "bg-green-500"
                statusLabel = "Online"
              } else if (device.state === 60) {
                dotColor = "bg-red-500"
                statusLabel = "Offline"
              } else {
                // You can expand this mapping as needed
                statusLabel = getDeviceStatusInfo(device.state).label
              }

              return (
                <div
                  key={device.id}
                  className="flex items-center space-x-3 rounded p-2 hover:bg-gray-50"
                >
                  <Checkbox
                    id={device.id}
                    checked={selectedDevices.includes(device.id)}
                    onCheckedChange={(checked) =>
                      onDeviceToggle(device.id, !!checked)
                    }
                  />
                  <span className="group relative inline-block">
                    <Smartphone className="h-4 w-4 text-gray-400" />
                    <span
                      className={`absolute -top-1 -right-1 h-2 w-2 rounded-full border border-white ${dotColor}`}
                    ></span>
                    {/* Tooltip */}
                    <span className="pointer-events-none absolute left-1/2 z-10 mt-2 w-max -translate-x-1/2 scale-0 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                      {statusLabel}
                    </span>
                  </span>
                  <Label htmlFor={device.id} className="flex-1 cursor-pointer">
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-medium text-gray-900">
                          {deviceName}
                        </span>
                        <Badge variant="secondary" className="rounded-full">
                          {device.os}{" "}
                          {device.platform === "ANDROID"
                            ? `${device.os_version} (${getAndroidSdkLevel(device.os_version)})`
                            : device.os_version}
                        </Badge>
                      </div>
                      {deviceAlias && (
                        <div className="text-xs text-gray-500">
                          {deviceAlias}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {device.serial}
                      </div>
                    </div>
                  </Label>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && !loading && !error && (
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                ),
              )}
            </div>

            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
