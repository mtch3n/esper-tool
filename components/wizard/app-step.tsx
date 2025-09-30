import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react"
import { useEffect, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppUpload } from "@/hooks/use-app-upload"
import { useApplications } from "@/hooks/useApplications"
import type { EsperApplication, EsperCredentials } from "@/lib/esper-api"

interface AppStepProps {
  selectedApplications: string[]
  launchApps: string[]
  onApplicationsSelect: (appIds: string[]) => void
  onLaunchAppsChange: (appIds: string[]) => void
  onAppVersionsSelect?: (appVersions: Map<string, string>) => void
  onApplicationDataSelect?: (
    applicationsData: Map<string, EsperApplication>,
  ) => void
  credentials: EsperCredentials
}

export function AppStep({
  selectedApplications,
  launchApps,
  onApplicationsSelect,
  onLaunchAppsChange,
  onAppVersionsSelect,
  onApplicationDataSelect,
  credentials,
}: AppStepProps) {
  const [mode, setMode] = useState<"select" | "upload">("select")
  const [selectedApp, setSelectedApp] = useState<File | null>(null)
  const { uploading, error, uploadResult, uploadApp, clearError, clearResult } =
    useAppUpload()

  const applications = useApplications({
    limit: 5,
    onKaiduScannerFound: (appId: string) => {
      // Auto-select Kaidu Scanner
      if (!selectedApplications.includes(appId)) {
        onApplicationsSelect([...selectedApplications, appId])
      }
      // Auto-toggle launch switch for Kaidu Scanner
      if (!launchApps.includes(appId)) {
        onLaunchAppsChange([...launchApps, appId])
      }
    },
  })

  // Load applications when component mounts
  useEffect(() => {
    if (
      credentials.tenant_id &&
      credentials.apiKey &&
      credentials.enterprise_id
    ) {
      applications.loadApplications(credentials)
    }
  }, [credentials])

  // Note: Removed synchronization useEffect to prevent infinite loops
  // The UI now uses selectedApplications prop directly instead of applications.selectedApplications

  // Synchronize selected app versions with parent
  useEffect(() => {
    if (onAppVersionsSelect) {
      onAppVersionsSelect(applications.selectedAppVersions)
    }
  }, [applications.selectedAppVersions, onAppVersionsSelect])

  // Synchronize selected applications data with parent
  useEffect(() => {
    if (onApplicationDataSelect) {
      const selectedAppsData = new Map<string, EsperApplication>()
      selectedApplications.forEach((appId) => {
        const app = applications.applications.find((a) => a.id === appId)
        if (app) {
          selectedAppsData.set(appId, app)
        }
      })
      onApplicationDataSelect(selectedAppsData)
    }
  }, [selectedApplications, applications.applications, onApplicationDataSelect])

  // Handle search
  const handleSearch = (term: string) => {
    applications.setSearchTerm(term)
    if (term.trim()) {
      applications.searchApplications(credentials, term.trim())
    } else {
      applications.loadApplications(credentials)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    applications.setCurrentPage(page)
    applications.refreshApplications(credentials)
  }

  // Handle app selection
  const handleAppToggle = (appId: string) => {
    const isCurrentlySelected = selectedApplications.includes(appId)
    const newSelection = isCurrentlySelected
      ? selectedApplications.filter((id) => id !== appId)
      : [...selectedApplications, appId]

    onApplicationsSelect(newSelection)

    // Remove from launch apps if deselected
    if (isCurrentlySelected) {
      onLaunchAppsChange(launchApps.filter((id) => id !== appId))
    }
  }

  // Handle launch switch
  const handleLaunchToggle = (appId: string, checked: boolean) => {
    if (checked) {
      onLaunchAppsChange([...launchApps, appId])
    } else {
      onLaunchAppsChange(launchApps.filter((id) => id !== appId))
    }
  }

  // Handle upload
  const handleUpload = async () => {
    if (!selectedApp) return
    try {
      await uploadApp(credentials, selectedApp)
      // Refresh applications list after successful upload
      applications.refreshApplications(credentials)
    } catch (error) {
      // Error handling is already managed by the useAppUpload hook
      console.error("Upload failed:", error)
    } finally {
      // Reset file selection after upload attempt (success or failure)
      setSelectedApp(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatFileSize = (sizeInMb: number | undefined) => {
    if (sizeInMb === undefined || sizeInMb === null) {
      return "Unknown size"
    }
    return `${sizeInMb.toFixed(1)} MB`
  }

  // Handle tab switching
  const handleTabChange = (value: string) => {
    const newMode = value as "select" | "upload"
    setMode(newMode)

    // Refresh application list when switching to select tab
    if (
      newMode === "select" &&
      credentials.tenant_id &&
      credentials.apiKey &&
      credentials.enterprise_id
    ) {
      applications.refreshApplications(credentials)
    }
  }

  return (
    <Tabs value={mode} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="select" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Select Existing Apps
        </TabsTrigger>
        <TabsTrigger value="upload" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Upload New App
        </TabsTrigger>
      </TabsList>

      <p className="text-muted-foreground mt-3 text-left text-xs">
        After uploading an app, switch to "Select Existing Apps" to choose it
        for deployment
      </p>

      <TabsContent value="select" className="mt-6 space-y-4">
        {/* Search and Selection Controls */}
        <div className="flex items-center">
          <div
            className={`relative overflow-hidden ${
              selectedApplications.length > 0 ? "mr-3 flex-1" : "mr-3 flex-1"
            }`}
          >
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search applications..."
              value={applications.searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>

          {/* Refresh Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => applications.refreshApplications(credentials)}
            disabled={applications.loading}
            className="mr-3 flex-shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${applications.loading ? "animate-spin" : ""}`}
            />
          </Button>

          {/* Selection Controls with Enter/Exit Animation */}
          {selectedApplications.length > 0 && (
            <div
              className="data-[state=show]:animate-in data-[state=hide]:animate-out data-[state=show]:slide-in-from-right-0 data-[state=hide]:slide-out-to-right flex items-center gap-2 duration-300 ease-in-out"
              data-state="show"
            >
              <span className="text-sm whitespace-nowrap text-gray-600">
                {selectedApplications.length} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  applications.selectAllApplications()
                  onApplicationsSelect(
                    applications.applications.map((app) => app.id),
                  )
                }}
                className="whitespace-nowrap"
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onApplicationsSelect([])
                  onLaunchAppsChange([])
                }}
                className="whitespace-nowrap"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
        {/* Applications List */}
        {applications.loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading applications...</span>
          </div>
        ) : applications.error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Applications</AlertTitle>
            <AlertDescription>{applications.error}</AlertDescription>
          </Alert>
        ) : applications.applications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p>No applications found</p>
            {applications.searchTerm && (
              <p className="mt-2 text-sm">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {applications.applications.map((app: EsperApplication) => (
              <Card key={app.id} className="hover:bg-gray-50">
                <CardContent className="px-4 py-0">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedApplications.includes(app.id)}
                      onCheckedChange={() => handleAppToggle(app.id)}
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="mb-1 flex items-center justify-between pb-0.5">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <h3 className="truncate text-sm font-medium text-gray-900">
                              {app.application_name}
                            </h3>
                            {selectedApplications.includes(app.id) ? (
                              <div className="flex-shrink-0">
                                {applications.loadingVersions.has(app.id) ? (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Loading versions...
                                  </div>
                                ) : (
                                  <Select
                                    value={
                                      applications.selectedAppVersions.get(
                                        app.id,
                                      ) || ""
                                    }
                                    onValueChange={(versionId) =>
                                      applications.setSelectedAppVersion(
                                        app.id,
                                        versionId,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-5 min-w-[100px] px-2 py-0 text-xs">
                                      <SelectValue placeholder="Select version" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {applications.appVersions
                                        .get(app.id)
                                        ?.map((version) => (
                                          <SelectItem
                                            key={version.id}
                                            value={version.id}
                                          >
                                            v{version.version_code}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            <div className="text-xs text-gray-500">
                              Auto Start
                            </div>
                            <Switch
                              checked={launchApps.includes(app.id)}
                              onCheckedChange={(checked) =>
                                handleLaunchToggle(app.id, checked)
                              }
                              disabled={!selectedApplications.includes(app.id)}
                              className="scale-75"
                            />
                          </div>
                        </div>
                        <div className="mb-0 flex items-center justify-between">
                          <p className="truncate text-xs text-gray-600">
                            {app.package_name}
                          </p>
                          <p className="ml-2 flex-shrink-0 text-xs text-gray-500">
                            Updated: {formatDate(app.updated_on)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {applications.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {applications.applications.length} of{" "}
              {applications.totalCount} applications
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(applications.currentPage - 1)}
                disabled={!applications.hasPreviousPage}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="px-3 text-sm">
                Page {applications.currentPage} of {applications.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(applications.currentPage + 1)}
                disabled={!applications.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="upload" className="mt-6 space-y-4">
        <div className="rounded border-2 border-dashed border-gray-200 p-6 text-center hover:border-gray-300">
          <Input
            id="app-file"
            type="file"
            accept=".apk"
            onChange={(e) => {
              setSelectedApp(e.target.files?.[0] || null)
              clearError()
              clearResult()
            }}
            className="hidden"
            disabled={uploading}
          />
          <Label htmlFor="app-file" className="block cursor-pointer">
            <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              Click to select APK file
            </div>
          </Label>
        </div>

        {/* Single Alert Section - shows different states */}
        {(selectedApp || error || uploadResult) && (
          <div className="space-y-3">
            {/* File Ready State */}
            {selectedApp && !uploadResult && !error && (
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>File Ready</AlertTitle>
                <AlertDescription>
                  <div className="font-medium">{selectedApp.name}</div>
                  <div className="text-sm">
                    Size: {(selectedApp.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success State */}
            {uploadResult && !error && (
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Upload Successful</AlertTitle>
                <AlertDescription>
                  {uploadResult.application ? (
                    <div className="space-y-1">
                      <div className="font-medium">
                        {uploadResult.application.application_name}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>
                          Package: {uploadResult.application.package_name}
                        </div>
                        <div>App ID: {uploadResult.application.id}</div>
                        <div>
                          Versions: {uploadResult.application.versions.length}
                        </div>
                      </div>
                    </div>
                  ) : uploadResult.content ? (
                    <div className="space-y-1">
                      <div className="font-medium">
                        {uploadResult.content.app_name}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>Platform: {uploadResult.content.platform}</div>
                        <div>Package: {uploadResult.content.package_name}</div>
                        <div>App ID: {uploadResult.content.id}</div>
                      </div>
                    </div>
                  ) : (
                    <div>Application uploaded successfully</div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Button - always shows, disabled after upload attempt */}
            <Button
              onClick={handleUpload}
              disabled={
                uploading ||
                !!uploadResult ||
                !!error ||
                !selectedApp ||
                !credentials.tenant_id ||
                !credentials.apiKey ||
                !credentials.enterprise_id
              }
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading to Esper...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
