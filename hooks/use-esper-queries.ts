import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  esperApiService,
  type EsperDevice,
  type EsperDeviceApp,
  type EsperCredentials,
} from "@/lib/esper-api"

// Query Keys - Centralized for better cache management
export const queryKeys = {
  devices: (credentials: EsperCredentials, options?: any) =>
    [
      "devices",
      credentials.tenant_id,
      credentials.enterprise_id,
      options,
    ] as const,
  deviceApps: (credentials: EsperCredentials, deviceId: string) =>
    [
      "deviceApps",
      credentials.tenant_id,
      credentials.enterprise_id,
      deviceId,
    ] as const,
  validateCredentials: (credentials: EsperCredentials) =>
    [
      "validateCredentials",
      credentials.tenant_id,
      credentials.enterprise_id,
    ] as const,
}

// Hook for fetching devices
export function useDevices(
  credentials: EsperCredentials,
  enabled: boolean = true,
  options: {
    search?: string
    limit?: number
    offset?: number
    ordering?: string
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.devices(credentials, options),
    queryFn: () => esperApiService.getDevices(credentials, options),
    enabled:
      enabled &&
      !!credentials.tenant_id &&
      !!credentials.apiKey &&
      !!credentials.enterprise_id,
    staleTime: 2 * 60 * 1000, // 2 minutes - devices status changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Useful for device status updates
  })
}

// Hook for fetching device apps
export function useDeviceApps(
  credentials: EsperCredentials,
  deviceId: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: queryKeys.deviceApps(credentials, deviceId),
    queryFn: () => esperApiService.getDeviceApps(credentials, deviceId),
    enabled:
      enabled &&
      !!credentials.tenant_id &&
      !!credentials.apiKey &&
      !!credentials.enterprise_id &&
      !!deviceId,
    staleTime: 10 * 60 * 1000, // 10 minutes - apps don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2, // Device might be offline, so fewer retries
    refetchOnWindowFocus: false, // Apps don't change when window is focused
  })
}

// Hook for validating credentials
export function useValidateCredentials(
  credentials: EsperCredentials,
  enabled: boolean = false,
) {
  return useQuery({
    queryKey: queryKeys.validateCredentials(credentials),
    queryFn: () => esperApiService.validateCredentials(credentials),
    enabled:
      enabled &&
      !!credentials.tenant_id &&
      !!credentials.apiKey &&
      !!credentials.enterprise_id,
    staleTime: 30 * 60 * 1000, // 30 minutes - credentials don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1, // Only retry once for validation
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

// Hook for refreshing device data
export function useRefreshDevices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: EsperCredentials) => {
      // Invalidate and refetch devices
      await queryClient.invalidateQueries({
        queryKey: ["devices", credentials.tenant_id, credentials.enterprise_id],
      })

      // Also invalidate all device apps for this tenant
      await queryClient.invalidateQueries({
        queryKey: [
          "deviceApps",
          credentials.tenant_id,
          credentials.enterprise_id,
        ],
      })
    },
    onSuccess: () => {
      // Optional: Show success toast
      console.log("Device data refreshed successfully")
    },
    onError: (error) => {
      console.error("Failed to refresh device data:", error)
    },
  })
}

// Utility type for app information with version
export interface AppInfo {
  name: string
  version: string
  packageName: string
}

// Utility type for device with app status
export interface DeviceWithApps extends EsperDevice {
  apps?: {
    dplayer?: AppInfo
    kscanner?: AppInfo
    isLoading: boolean
    error?: string
  }
}

// Helper function to extract app information with versions
export function extractAppInfo(apps: EsperDeviceApp[]): {
  dplayer?: AppInfo
  kscanner?: AppInfo
} {
  const dplayerApp = apps.find(
    (app) =>
      app.package_name.toLowerCase().includes("dolphin") ||
      app.app_name.toLowerCase().includes("dolphin") ||
      app.app_name.toLowerCase().includes("dplayer"),
  )

  const kscannerApp = apps.find(
    (app) =>
      app.package_name.toLowerCase().includes("kaidu") ||
      app.app_name.toLowerCase().includes("kaidu") ||
      app.app_name.toLowerCase().includes("kscanner"),
  )

  const result: { dplayer?: AppInfo; kscanner?: AppInfo } = {}

  if (dplayerApp) {
    result.dplayer = {
      name: dplayerApp.app_name,
      version: dplayerApp.version_name || dplayerApp.version_code || "Unknown",
      packageName: dplayerApp.package_name,
    }
  }

  if (kscannerApp) {
    result.kscanner = {
      name: kscannerApp.app_name,
      version:
        kscannerApp.version_name || kscannerApp.version_code || "Unknown",
      packageName: kscannerApp.package_name,
    }
  }

  return result
}
