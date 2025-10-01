import { AlertCircle, Camera, CheckCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { ResultsHeaderProps } from "./types"

export function ResultsHeader({
  isComplete,
  hasFailed,
  selectedDevices,
  devices,
  onViewScreenshots,
}: ResultsHeaderProps) {
  return (
    <div className="text-center">
      {isComplete ? (
        <>
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Deployment Completed Successfully!
          </h2>
          <p className="mt-2 text-gray-600">
            All applications have been deployed to {selectedDevices.length}{" "}
            device(s).
          </p>
          {onViewScreenshots && (
            <div className="mt-4">
              <Button
                onClick={onViewScreenshots}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="mr-2 h-4 w-4" />
                Review Screenshots
              </Button>
            </div>
          )}
        </>
      ) : hasFailed ? (
        <>
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Deployment Failed
          </h2>
          <p className="mt-2 text-gray-600">
            A deployment step encountered an error. You can retry the failed
            step below.
          </p>
        </>
      ) : (
        <>
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Deployment in Progress
          </h2>
          <p className="mt-2 text-gray-600">
            Please wait while we deploy your applications...
          </p>
        </>
      )}
    </div>
  )
}
