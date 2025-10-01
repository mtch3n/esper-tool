import { Play } from "lucide-react"
import { useEffect, useState } from "react"

import type { EsperApplication, EsperDevice } from "@/lib/esper-api"
import { esperApiService } from "@/lib/esper-api"

interface Credentials {
  tenant_id: string
  apiKey: string
  enterprise_id: string
}

interface SummaryStepProps {
  credentials: Credentials
  selectedDevices: string[]
  devices: EsperDevice[]
  selectedApplications: string[]
  launchApps: string[]
  rebootAfterDeploy: boolean
}

export function SummaryStep({
  credentials,
  selectedDevices,
  devices,
  selectedApplications,
  launchApps,
  rebootAfterDeploy,
}: SummaryStepProps) {
  const [applications, setApplications] = useState<EsperApplication[]>([])
  const [loading, setLoading] = useState(false)

  // Load application details for selected applications
  useEffect(() => {
    const loadApplicationDetails = async () => {
      if (selectedApplications.length === 0) return

      setLoading(true)
      try {
        const response = await esperApiService.getApplications(credentials)
        const selectedApps = response.results.filter((app) =>
          selectedApplications.includes(app.id),
        )
        setApplications(selectedApps)
      } catch (error) {
        console.error("Error loading application details:", error)
      } finally {
        setLoading(false)
      }
    }

    loadApplicationDetails()
  }, [selectedApplications, credentials])

  return (
    <div className="max-h-120 space-y-4 overflow-y-auto">
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-900">
          Devices ({selectedDevices.length})
        </div>
        <div className="max-h-32 overflow-y-auto pl-3 text-sm text-gray-600">
          {selectedDevices.map((deviceId) => {
            const device = devices.find((d) => d.id === deviceId)
            return (
              <div key={deviceId}>
                {device
                  ? `${device.name || device.alias || "Unnamed Device"} (${device.serial})`
                  : deviceId}
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-900">Applications</div>
        <div className="pl-3 text-sm text-gray-600">
          {selectedApplications.length > 0 && (
            <div>
              <div className="font-medium">
                Selected Applications ({selectedApplications.length}):
              </div>
              {loading ? (
                <div className="pl-2 text-gray-500">
                  Loading application details...
                </div>
              ) : (
                <div className="space-y-1 pl-2">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center gap-2">
                      <div>
                        {app.application_name} ({app.package_name})
                        {app.versions.length > 0 && (
                          <span className="ml-2 text-xs text-gray-500">
                            v{app.versions[0].version_code}
                          </span>
                        )}
                      </div>
                      {launchApps.includes(app.id) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          <Play className="h-3 w-3" />
                          Launch
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedApplications.length === 0 && (
            <div>No applications selected</div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-900">Options</div>
        <div className="pl-3 text-sm text-gray-600">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-700">
                Reboot devices after deployment:
              </span>
              <span
                className={`font-medium ${
                  rebootAfterDeploy ? "text-green-600" : "text-gray-500"
                }`}
              >
                {rebootAfterDeploy ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
