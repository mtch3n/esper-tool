"use client"

import { AlertCircle, Loader2, Settings, Smartphone } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

import { DataTable } from "@/components/devices/data-table"
import { deviceColumns } from "@/components/devices/device-columns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCredentials } from "@/hooks/use-credentials"
import { useDevices } from "@/hooks/use-esper-queries"
import type { EsperDevice } from "@/lib/esper-api"

export function DeviceList() {
  const { credentials, hasStoredCredentials } = useCredentials()

  // Fetch devices using React Query
  const {
    data: devices = [],
    isLoading: devicesLoading,
    error: devicesError,
    isFetching,
  } = useDevices(credentials, hasStoredCredentials)

  // Convert devices to table format
  const tableData: EsperDevice[] = useMemo(() => {
    return devices
  }, [devices])

  if (!hasStoredCredentials) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Credentials Configured
            </h3>
            <p className="mt-2 text-gray-600">
              You need to configure your Esper credentials before you can view
              devices.
            </p>
            <div className="mt-6">
              <Link href="/settings">
                <Button>Go to Settings</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (devicesError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Devices</AlertTitle>
        <AlertDescription className="mt-2">
          {devicesError.message}
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {devicesLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-600">Loading devices...</span>
            </div>
          </CardContent>
        </Card>
      ) : devices.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Smartphone className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No Devices Found
              </h3>
              <p className="mt-2 text-gray-600">
                No devices are currently enrolled in your Esper tenant.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={deviceColumns}
          data={tableData}
          searchPlaceholder="Search devices..."
          searchColumn="name"
        />
      )}
    </div>
  )
}
