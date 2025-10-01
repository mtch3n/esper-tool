import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import type { DeviceCardProps } from "./types"

export function DeviceCard({
  deviceId,
  device,
  isExpanded,
  launchApps,
  onToggleExpansion,
  variant,
  deviceStatus,
}: DeviceCardProps) {
  const isSuccess = variant === "success"
  const isFailed = variant === "failed"

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpansion}>
      <div
        className={`rounded-lg border shadow-sm ${
          isFailed ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
        }`}
      >
        <CollapsibleTrigger className="w-full">
          <div
            className={`flex items-center justify-between p-4 transition-colors ${
              isFailed ? "hover:bg-red-100" : "hover:bg-green-100"
            }`}
          >
            <div className="flex items-center gap-3">
              {isFailed ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <div className="text-left">
                <h3 className="font-medium text-gray-900">
                  {device?.name || `Device ${deviceId.slice(-4)}`}
                </h3>
                <p className="text-sm text-gray-600">
                  {device?.serial || deviceId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={
                  isFailed
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }
              >
                {isFailed ? "Failed" : "Deployed"}
              </Badge>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div
            className={`border-t px-4 pt-3 pb-4 ${
              isFailed ? "border-red-200" : "border-green-200"
            }`}
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="mb-1 font-medium text-gray-700">Device Info</h4>
                <p className="text-gray-600">
                  Serial: {device?.serial || deviceId}
                </p>
                <p className="text-gray-600">
                  Model: {device?.hardware_info?.model || "Unknown"}
                </p>
                {deviceStatus && (
                  <p className="text-gray-600">Status: {deviceStatus.state}</p>
                )}
              </div>
              <div>
                <h4 className="mb-1 font-medium text-gray-700">
                  Deployment Status
                </h4>
                {isFailed ? (
                  <>
                    <p className="text-red-600">✗ Installation failed</p>
                    <p className="text-gray-500">- Network timeout</p>
                  </>
                ) : (
                  <>
                    <p className="text-green-600">
                      ✓ All applications installed successfully
                    </p>
                    <p className="text-green-600">✓ Applications enabled</p>
                    {launchApps.length > 0 && (
                      <p className="text-green-600">✓ Applications launched</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
