// Esper API service
interface EsperCredentials {
  tenant_id: string
  apiKey: string
  enterprise_id: string
}

// Base pagination interface
interface EsperPaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Base pagination parameters
interface PaginationParams {
  limit?: number
  offset?: number
  ordering?: string
}

interface EsperDevice {
  id: string
  name: string
  alias: string
  os: string
  state: number
  platform: string
  serial: string
  os_version: string
  global_device_id?: string | null
  tenant_id?: string | null
  onboarded_on?: string | null
  provisioned_on?: string | null
  hardware_info: {
    model: string
    serial: string
  }
  software_info: {
    os_version: string
  }
  network_info: {
    imei1?: string
    network_type?: string
  }
  memory_info: Record<string, any>
  battery_stats: {
    battery_level: number
  }
  blueprint_info: {
    assigned_blueprint_id?: string
    current_blueprint_id?: string
    current_blueprint_version_id?: string
    blueprint_upgrade_status?: string
  }
  network_stats: {
    current_active_connection?: string
    wifi_network_info?: {
      wifi_ssid?: string
    }
    cellular_network_info?: {
      network_type?: string
    }
  }
  location_stats: {
    altitude?: string
    latitude?: string
    longitude?: string
  }
  status: number
  tags: any[]
  last_seen?: string
  group_id?: string
  is_seamless: boolean
  managed_by?: string
  mqtt_topic?: string | null
  fcm_id?: string | null
  is_gms: boolean
  dpc_version?: string
  eea_version?: string
  security_state?: string
  created_by?: string | null
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

interface EsperDeviceListResponse {
  code: number
  message: string
  content: EsperPaginatedResponse<EsperDevice>
}

interface EsperApplication {
  id: string
  versions: EsperApplicationVersion[]
  application_name: string
  package_name: string
  developer: string
  category: string
  content_rating: string
  compatibility: string
  created_on: string
  updated_on: string
  is_active: boolean
  is_hidden: boolean
  enterprise: string
}

interface EsperApplicationVersion {
  id: string
  installed_count: number
  permissions: any[]
  app_file: string
  app_icon: string
  version_code: string
  build_number: string
  size_in_mb: number
  hash_string: string
  release_name: string
  release_comments: string
  release_track: "Alpha" | "Beta" | "Production"
  created_on: string
  updated_on: string
  min_sdk_version: string
  target_sdk_version: string
  is_enabled: boolean
  is_default: boolean
  enterprise: string
  application: string
  approval_status: "AVAILABLE" | "ACCEPTED" | "APPROVED" | "REJECTED"
}

interface EsperApplicationListResponse
  extends EsperPaginatedResponse<EsperApplication> {}

interface EsperApiError {
  errors: string[]
  message: string
  status: number
}

interface EsperAppUploadResponse {
  content?: {
    id: string
    version_id: string
    app_name: string
    platform: string
    tenant_id: string
    package_name: string
    created_at: string
    created_by: string
    updated_at: string
    updated_by: string
  }
  application?: {
    id: string
    versions: EsperApplicationVersion[]
    application_name: string
    package_name: string
    developer: string
    category: string
    content_rating: string
    compatibility: string
    created_on: string
    updated_on: string
    is_active: boolean
    is_hidden: boolean
    enterprise: string
  }
}

interface EsperCompanySettings {
  id: string
  name: string
  short_code: string
  registered_name: string
  registered_address: string
  location: string
  zipcode: string
  contact_person: string | null
  contact_number: string | null
  contact_email: string
  wifi_lte_toggle_flag: boolean
  emm: {
    google_enterprise_id: string
  }
  created_on: string
  updated_on: string
}

interface EsperCommandRequest {
  command_type: "DEVICE" | "GROUP" | "DYNAMIC"
  devices: string[]
  groups?: string[]
  device_type?: string
  command: string
  command_args: {
    app_version?: string
    package_name?: string
    [key: string]: any
  }
  schedule?: "IMMEDIATE" | "WINDOW" | "RECURRING"
  schedule_args?: any
}

interface EsperCommandResponse {
  id: string
  enterprise: string
  command_type: string
  devices: string[]
  command: string
  command_args: any
  schedule: string
  issued_by: string
  created_on: string
  status: EsperCommandStatus[]
}

interface EsperCommandStatus {
  id: string
  device: string
  state:
    | "Command Queued"
    | "Command Initiated"
    | "Command Acknowledged"
    | "Command In Progress"
    | "Command TimeOut"
    | "Command Success"
    | "Command Failure"
    | "Command Scheduled"
    | "Command Cancelled"
  command_id: string
  created_on: string
  updated_on: string
}

interface EsperDeviceApp {
  id: string
  app_name: string
  package_name: string
  version_name: string
  version_code: string
  app_type: string
  is_system: boolean
  state: string
}

interface EsperDeviceAppsResponse {
  results: EsperDeviceApp[]
}

interface EsperScreenshot {
  id: string
  device: string
  enterprise: string
  image_file: string
  thumbnail: string
  tag: string | null
  created_on: string
  updated_on: string
}

interface EsperScreenshotsResponse
  extends EsperPaginatedResponse<EsperScreenshot> {}

interface EsperAppVersionsResponse
  extends EsperPaginatedResponse<EsperApplicationVersion> {}

class EsperApiService {
  private getBaseUrl(tenantId: string) {
    return `https://${tenantId}-api.esper.cloud/api`
  }

  private getHeaders(apiKey: string) {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }
  }

  private buildUrl(
    baseUrl: string,
    path: string,
    params?: URLSearchParams,
  ): string {
    const url = `${baseUrl}${path}`
    return params?.toString() ? `${url}?${params}` : url
  }

  private buildParams(options: Record<string, any>): URLSearchParams {
    const params = new URLSearchParams()

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v.toString()))
        } else {
          params.append(key, value.toString())
        }
      }
    })

    return params
  }

  private async makeRequest<T>(
    url: string,
    method: "GET" | "POST" = "GET",
    headers: Record<string, string>,
    body?: any,
  ): Promise<T> {
    const config: RequestInit = {
      method,
      headers,
    }

    if (body) {
      if (body instanceof FormData) {
        // For FormData, remove Content-Type to let browser set boundary
        delete headers["Content-Type"]
        config.body = body
      } else {
        config.body = JSON.stringify(body)
      }
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  async getDevices(
    credentials: EsperCredentials,
    params: PaginationParams & { search?: string } = {},
  ): Promise<EsperDevice[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const urlParams = this.buildParams(params)
      const url = this.buildUrl(baseUrl, "/device/v0/devices/", urlParams)

      const data: EsperDeviceListResponse = await this.makeRequest(
        url,
        "GET",
        this.getHeaders(credentials.apiKey),
      )

      if (data.code !== 200) {
        throw new Error(data.message || "API error")
      }

      return data.content.results
    } catch (error) {
      console.error("Error fetching devices:", error)
      throw error
    }
  }

  async searchDevices(
    credentials: EsperCredentials,
    searchTerm: string,
    params: PaginationParams = {},
  ): Promise<EsperDevice[]> {
    return this.getDevices(credentials, { ...params, search: searchTerm })
  }

  async getApplications(
    credentials: EsperCredentials,
    options: PaginationParams & {
      application_name?: string
      package_name?: string
      is_active?: boolean
      is_hidden?: boolean
    } = {},
  ): Promise<EsperApplicationListResponse> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const params = this.buildParams(options)
      const url = this.buildUrl(
        baseUrl,
        `/enterprise/${credentials.enterprise_id}/application/`,
        params,
      )

      return await this.makeRequest<EsperApplicationListResponse>(
        url,
        "GET",
        this.getHeaders(credentials.apiKey),
      )
    } catch (error) {
      console.error("Error fetching applications:", error)
      throw error
    }
  }

  async uploadApp(
    credentials: EsperCredentials,
    file: File,
  ): Promise<EsperAppUploadResponse> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = this.buildUrl(
        baseUrl,
        `/enterprise/${credentials.enterprise_id}/application/upload/`,
      )

      const formData = new FormData()
      formData.append("app_file", file)

      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`

        try {
          const errorData: EsperApiError = await response.json()
          if (errorData.errors?.length > 0) {
            const firstError = errorData.errors[0]
            const match = firstError.match(/string='([^']+)'/)
            errorMessage = match?.[1] || errorData.message || firstError
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch {
          // Use default error message if parsing fails
        }

        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      console.error("Error uploading app:", error)
      throw error
    }
  }

  async validateCredentials(
    credentials: EsperCredentials,
  ): Promise<EsperCompanySettings> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = this.buildUrl(
        baseUrl,
        `/v1/enterprise/${credentials.enterprise_id}/`,
      )

      return await this.makeRequest<EsperCompanySettings>(
        url,
        "GET",
        this.getHeaders(credentials.apiKey),
      )
    } catch (error) {
      // Enhanced error messages for credential validation
      if (error instanceof Error && error.message.includes("401")) {
        throw new Error("Invalid API key")
      } else if (error instanceof Error && error.message.includes("404")) {
        throw new Error("Invalid tenant ID or enterprise ID")
      } else if (error instanceof Error && error.message.includes("4")) {
        throw new Error("Invalid credentials")
      }

      console.error("Error validating credentials:", error)
      throw error
    }
  }

  async deployAppToDevices(
    credentials: EsperCredentials,
    devices: string[],
    appVersionId: string,
  ): Promise<EsperCommandResponse> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = `${baseUrl}/v0/enterprise/${credentials.enterprise_id}/command/`

      const commandRequest: EsperCommandRequest = {
        command_type: "DEVICE",
        devices: devices,
        command: "INSTALL",
        command_args: {
          app_version: appVersionId,
          app_state: "SHOW",
        },
        groups: [],
        device_type: "all",
      }

      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(credentials.apiKey),
        body: JSON.stringify(commandRequest),
      })

      if (!response.ok) {
        let errorMessage = `Failed to deploy app: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.warn("Could not parse error response")
        }
        throw new Error(errorMessage)
      }

      const data: EsperCommandResponse = await response.json()
      return data
    } catch (error) {
      console.error("Error deploying app:", error)
      throw error
    }
  }

  async launchAppsOnDevices(
    credentials: EsperCredentials,
    devices: string[],
    appsData: Map<string, { package_name: string; application_name: string }>,
  ): Promise<EsperCommandResponse[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = `${baseUrl}/v0/enterprise/${credentials.enterprise_id}/command/`

      const commandPromises = Array.from(appsData.values()).map(async (app) => {
        const commandRequest = {
          command_type: "DEVICE",
          command: "UPDATE_DEVICE_CONFIG",
          command_args: {
            custom_settings_config: {
              scripts: [
                {
                  action: "LAUNCH",
                  actionParams: {
                    flags: 270532608,
                    launchType: "ACTIVITY",
                    intentAction: "android.intent.action.MAIN",
                    componentName: `${app.package_name}/${app.package_name}.MainActivity`,
                  },
                },
              ],
            },
          },
          schedule: "IMMEDIATE",
          devices: devices,
          device_type: "all",
        }

        const response = await fetch(url, {
          method: "POST",
          headers: this.getHeaders(credentials.apiKey),
          body: JSON.stringify(commandRequest),
        })

        if (!response.ok) {
          let errorMessage = `Failed to launch app ${app.application_name}: ${response.status}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
          } catch (e) {
            console.warn("Could not parse error response")
          }
          throw new Error(errorMessage)
        }

        return await response.json()
      })

      const result = await Promise.all(commandPromises)

      return result
    } catch (error) {
      console.error("Error launching apps:", error)
      throw error
    }
  }

  async launchEsperLauncher(
    credentials: EsperCredentials,
    devices: string[],
  ): Promise<EsperCommandResponse> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = `${baseUrl}/v0/enterprise/${credentials.enterprise_id}/command/`

      const commandRequest = {
        command_type: "DEVICE",
        command: "UPDATE_DEVICE_CONFIG",
        command_args: {
          custom_settings_config: {
            scripts: [
              {
                action: "LAUNCH",
                actionParams: {
                  flags: 270532608,
                  launchType: "ACTIVITY",
                  intentAction: "android.intent.action.MAIN",
                  componentName: `io.shoonya.shoonyadpc/com.shoonyaos.shoonyadpc.activities.Dashboard`,
                },
              },
            ],
          },
        },
        schedule: "IMMEDIATE",
        devices: devices,
        device_type: "all",
      }

      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(credentials.apiKey),
        body: JSON.stringify(commandRequest),
      })

      if (!response.ok) {
        let errorMessage = `Failed to launch Dolphin Store: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.warn("Could not parse error response")
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      console.error("Error launching Dolphin Store:", error)
      throw error
    }
  }

  async enableAppsOnDevices(
    credentials: EsperCredentials,
    devices: string[],
    appsData: Map<string, { package_name: string; application_name: string }>,
    appVersions: Map<string, string>, // appId -> versionId for version info
  ): Promise<EsperCommandResponse[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = `${baseUrl}/v0/enterprise/${credentials.enterprise_id}/command/`

      const commandPromises = Array.from(appsData.entries()).map(
        async ([appId, app]) => {
          // Get version info from the appVersions map if available
          const versionId = appVersions.get(appId)
          const commandRequest = {
            command_type: "DEVICE",
            command: "SET_APP_STATE",
            command_args: {
              package_name: app.package_name,
              app_state: "SHOW",
            },
            devices: devices,
            groups: [],
            device_type: "all",
          }

          const response = await fetch(url, {
            method: "POST",
            headers: this.getHeaders(credentials.apiKey),
            body: JSON.stringify(commandRequest),
          })

          if (!response.ok) {
            let errorMessage = `Failed to enable app ${app.application_name}: ${response.status}`
            try {
              const errorData = await response.json()
              errorMessage = errorData.message || errorMessage
            } catch (e) {
              console.warn("Could not parse error response")
            }
            throw new Error(errorMessage)
          }

          return await response.json()
        },
      )

      return await Promise.all(commandPromises)
    } catch (error) {
      console.error("Error enabling apps:", error)
      throw error
    }
  }

  async getCommandStatus(
    credentials: EsperCredentials,
    requestId: string,
  ): Promise<EsperCommandStatus[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = `${baseUrl}/v0/enterprise/${credentials.enterprise_id}/command/${requestId}/status/`

      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(credentials.apiKey),
      })

      if (!response.ok) {
        throw new Error(`Failed to get command status: ${response.status}`)
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error("Error getting command status:", error)
      throw error
    }
  }

  async getDeviceApps(
    credentials: EsperCredentials,
    deviceId: string,
  ): Promise<EsperDeviceApp[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = `${baseUrl}/enterprise/${credentials.enterprise_id}/device/${deviceId}/app/`

      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(credentials.apiKey),
      })

      if (!response.ok) {
        throw new Error(`Failed to get device apps: ${response.status}`)
      }

      const data: EsperDeviceAppsResponse = await response.json()
      return data.results
    } catch (error) {
      console.error("Error getting device apps:", error)
      throw error
    }
  }

  // Convenience method to get all devices with automatic pagination
  async getAllDevices(
    credentials: EsperCredentials,
    options: { search?: string; maxResults?: number } = {},
  ): Promise<EsperDevice[]> {
    const allDevices: EsperDevice[] = []
    let offset = 0
    const limit = 100 // Batch size
    const maxResults = options.maxResults || Infinity

    while (allDevices.length < maxResults) {
      const batchSize = Math.min(limit, maxResults - allDevices.length)
      const devices = await this.getDevices(credentials, {
        ...options,
        limit: batchSize,
        offset,
      })

      if (devices.length === 0) break

      allDevices.push(...devices)
      offset += devices.length

      // If we got less than requested, we've reached the end
      if (devices.length < batchSize) break
    }

    return allDevices.slice(0, maxResults)
  }

  // Convenience method to get all applications with automatic pagination
  async getAllApplications(
    credentials: EsperCredentials,
    options: {
      application_name?: string
      package_name?: string
      is_active?: boolean
      is_hidden?: boolean
      maxResults?: number
    } = {},
  ): Promise<EsperApplication[]> {
    const allApps: EsperApplication[] = []
    let offset = 0
    const limit = 100 // Batch size
    const maxResults = options.maxResults || Infinity

    while (allApps.length < maxResults) {
      const batchSize = Math.min(limit, maxResults - allApps.length)
      const response = await this.getApplications(credentials, {
        ...options,
        limit: batchSize,
        offset,
      })

      if (response.results.length === 0) break

      allApps.push(...response.results)
      offset += response.results.length

      // If we got less than requested, we've reached the end
      if (response.results.length < batchSize) break
    }

    return allApps.slice(0, maxResults)
  }

  async rebootDevice(
    credentials: EsperCredentials,
    deviceId: string,
  ): Promise<EsperCommandResponse>
  async rebootDevice(
    credentials: EsperCredentials,
    deviceIds: string[],
  ): Promise<EsperCommandResponse>
  async rebootDevice(
    credentials: EsperCredentials,
    deviceIds: string | string[],
  ): Promise<EsperCommandResponse> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = `${baseUrl}/v0/enterprise/${credentials.enterprise_id}/command/`

      // Handle both single device and array of devices
      const devices = Array.isArray(deviceIds) ? deviceIds : [deviceIds]

      const commandRequest = {
        command_type: "DEVICE",
        command: "REBOOT",
        devices: devices,
        groups: [],
        device_type: "all",
      }

      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(credentials.apiKey),
        body: JSON.stringify(commandRequest),
      })

      if (!response.ok) {
        let errorMessage = `Failed to reboot device: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.warn("Could not parse error response")
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      console.error("Error rebooting device:", error)
      throw error
    }
  }

  async captureScreenshots(
    credentials: EsperCredentials,
    devices: string[],
    tag?: string,
  ): Promise<EsperCommandResponse> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = `${baseUrl}/v0/enterprise/${credentials.enterprise_id}/command/`

      const commandRequest = {
        command_type: "DEVICE",
        command: "CAPTURE_SCREENSHOT",
        command_args: {
          tag: "tag",
        },
        devices: devices,
        groups: [],
        device_type: "active",
      }

      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(credentials.apiKey),
        body: JSON.stringify(commandRequest),
      })

      if (!response.ok) {
        let errorMessage = `Failed to capture screenshots: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.warn("Could not parse error response")
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      console.error("Error capturing screenshots:", error)
      throw error
    }
  }

  async getDeviceScreenshots(
    credentials: EsperCredentials,
    deviceId: string,
    options: PaginationParams = {},
  ): Promise<EsperScreenshot[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const params = this.buildParams(options)
      const url = this.buildUrl(
        baseUrl,
        `/v0/enterprise/${credentials.enterprise_id}/device/${deviceId}/screenshot/`,
        params,
      )

      const response: EsperScreenshotsResponse = await this.makeRequest(
        url,
        "GET",
        this.getHeaders(credentials.apiKey),
      )

      return response.results
    } catch (error) {
      console.error("Error fetching device screenshots:", error)
      throw error
    }
  }

  async getLatestDeviceScreenshot(
    credentials: EsperCredentials,
    deviceId: string,
  ): Promise<EsperScreenshot | null> {
    try {
      const screenshots = await this.getDeviceScreenshots(
        credentials,
        deviceId,
        {
          limit: 1,
          ordering: "-created_on", // Get most recent first
        },
      )

      return screenshots.length > 0 ? screenshots[0] : null
    } catch (error) {
      console.error("Error fetching latest screenshot:", error)
      throw error
    }
  }

  async getAppVersions(
    credentials: EsperCredentials,
    applicationId: string,
    options: PaginationParams & {
      version_code?: string
      build_number?: string
      is_enabled?: boolean
      is_default?: boolean
      approval_status?: "AVAILABLE" | "ACCEPTED" | "APPROVED" | "REJECTED"
    } = {},
  ): Promise<EsperAppVersionsResponse> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const params = this.buildParams(options)
      const url = this.buildUrl(
        baseUrl,
        `/v1/enterprise/${credentials.enterprise_id}/application/${applicationId}/version/`,
        params,
      )

      return await this.makeRequest<EsperAppVersionsResponse>(
        url,
        "GET",
        this.getHeaders(credentials.apiKey),
      )
    } catch (error) {
      console.error("Error getting app versions:", error)
      throw error
    }
  }
}

// Device status mapping based on Esper API documentation
export const DEVICE_STATUS_MAP: Record<
  number,
  { label: string; color: string }
> = {
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

export function getDeviceStatusInfo(state: number) {
  return (
    DEVICE_STATUS_MAP[state] || {
      label: `Status ${state}`,
      color: "bg-gray-200 text-gray-500",
    }
  )
}

export const esperApiService = new EsperApiService()

// Export individual methods for convenience
export const {
  getDevices,
  getAllDevices,
  getApplications,
  getAllApplications,
  uploadApp,
  validateCredentials,
  deployAppToDevices,
  launchAppsOnDevices,
  launchEsperLauncher,
  enableAppsOnDevices,
  getCommandStatus,
  getDeviceApps,
  rebootDevice,
  captureScreenshots,
  getDeviceScreenshots,
} = esperApiService

// Export methods that need 'this' context separately
export const getLatestDeviceScreenshot = (
  credentials: EsperCredentials,
  deviceId: string,
): Promise<EsperScreenshot | null> =>
  esperApiService.getLatestDeviceScreenshot(credentials, deviceId)

export type {
  EsperApiError,
  EsperApplication,
  EsperApplicationListResponse,
  EsperApplicationVersion,
  EsperAppUploadResponse,
  EsperAppVersionsResponse,
  EsperCommandRequest,
  EsperCommandResponse,
  EsperCommandStatus,
  EsperCompanySettings,
  EsperCredentials,
  EsperDevice,
  EsperDeviceApp,
  EsperDeviceAppsResponse,
  EsperPaginatedResponse,
  EsperScreenshot,
  PaginationParams,
}
