import type { StepDeviceStatus } from "./types"

interface StepDeviceStatusDisplayProps {
  deviceStatus: StepDeviceStatus
  devices: any[]
}

export function StepDeviceStatusDisplay({
  deviceStatus,
  devices,
}: StepDeviceStatusDisplayProps) {
  const { deviceStatuses, summary } = deviceStatus

  return (
    <div className="mb-3">
      <h4 className="mb-2 text-sm font-medium text-gray-700">Device Status</h4>
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {Array.from(deviceStatuses.entries()).map(([deviceKey, status]) => {
          // Extract device ID from device URL or use the key directly
          let deviceId = deviceKey
          if (deviceKey.includes("/device/")) {
            const match = deviceKey.match(/\/device\/([^\/]+)\/?/)
            deviceId = match ? match[1] : deviceKey
          }

          // Try to find device by ID
          const device = devices.find((d) => d.id === deviceId)

          // Use device name from meta if available (from API response), otherwise fallback
          let deviceName = device?.name || device?.alias

          // Check if the status object has meta information (from actual API response)
          if ((status as any).meta?.device?.device_name) {
            deviceName = (status as any).meta.device.device_name
          } else if ((status as any).meta?.device?.alias_name) {
            deviceName = (status as any).meta.device.alias_name
          }

          // Final fallback
          if (!deviceName) {
            deviceName = `Device ${deviceId.slice(-4)}`
          }

          const isSuccess = status.state === "Command Success"
          const isFailed = status.state === "Command Failure"

          return (
            <div
              key={deviceKey}
              className="flex items-center justify-between rounded bg-gray-50 px-2 py-1"
            >
              <span className="text-sm font-medium text-gray-700">
                {deviceName}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    isSuccess
                      ? "bg-green-100 text-green-800"
                      : isFailed
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {status.state}
                </span>
                {isFailed && (
                  <span
                    className="text-xs text-red-600"
                    title={`Failed: ${status.state}`}
                  >
                    ⚠️
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {/* Show summary */}
      {summary && (
        <div className="mt-2 border-t border-gray-200 pt-2">
          <p className="text-xs text-gray-600">
            {summary.successful} successful, {summary.failed} failed,{" "}
            {summary.inProgress} in progress
          </p>
        </div>
      )}
    </div>
  )
}
