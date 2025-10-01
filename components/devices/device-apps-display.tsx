"use client"

import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCredentials } from "@/hooks/use-credentials"
import {
  useDeviceApps,
  extractAppInfo,
  type AppInfo,
} from "@/hooks/use-esper-queries"

interface DeviceAppsDisplayProps {
  deviceId: string
}

export function DeviceAppsDisplay({ deviceId }: DeviceAppsDisplayProps) {
  const { credentials, hasStoredCredentials } = useCredentials()

  const {
    data: apps,
    isLoading,
    error,
  } = useDeviceApps(credentials, deviceId, hasStoredCredentials && !!deviceId)

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
  }

  if (error) {
    return <span className="text-xs text-red-400">Error</span>
  }

  if (!apps || apps.length === 0) {
    return <span className="text-xs text-gray-400">No apps</span>
  }

  const appInfo = extractAppInfo(apps)
  const badges: React.ReactNode[] = []

  if (appInfo.dplayer) {
    badges.push(
      <Badge
        key="dplayer"
        variant="default"
        className="bg-blue-100 text-xs text-blue-800"
      >
        DPlayer v{appInfo.dplayer.version}
      </Badge>,
    )
  }

  if (appInfo.kscanner) {
    badges.push(
      <Badge
        key="kscanner"
        variant="default"
        className="bg-purple-100 text-xs text-purple-800"
      >
        KScanner v{appInfo.kscanner.version}
      </Badge>,
    )
  }

  if (badges.length === 0) {
    return <span className="text-xs text-gray-400">None</span>
  }

  return <div className="flex flex-wrap gap-2">{badges}</div>
}
