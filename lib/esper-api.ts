// Esper API service
interface EsperCredentials {
  tenant_id: string
  apiKey: string
  enterprise_id: string
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
  content: {
    count: number
    prev?: string | null
    next?: string | null
    results: EsperDevice[]
  }
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

interface EsperApplicationListResponse {
  count: number
  next: string | null
  previous: string | null
  results: EsperApplication[]
}

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
    | "Command Received"
    | "Command Success"
    | "Command Failure"
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

interface EsperAppVersionsResponse {
  count: number
  next: string | null
  previous: string | null
  results: EsperApplicationVersion[]
}

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

  async getDevices(credentials: EsperCredentials): Promise<EsperDevice[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = `${baseUrl}/device/v0/devices/`
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(credentials.apiKey),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: EsperDeviceListResponse = await response.json()

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
  ): Promise<EsperDevice[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const url = `${baseUrl}/device/v0/devices/?search=${encodeURIComponent(searchTerm)}`
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(credentials.apiKey),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: EsperDeviceListResponse = await response.json()

      if (data.code !== 200) {
        throw new Error(data.message || "API error")
      }

      return data.content.results
    } catch (error) {
      console.error("Error searching devices:", error)
      throw error
    }
  }

  async getApplications(
    credentials: EsperCredentials,
    options: {
      application_name?: string
      package_name?: string
      limit?: number
      offset?: number
      is_active?: boolean
      is_hidden?: boolean
    } = {},
  ): Promise<EsperApplicationListResponse> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const params = new URLSearchParams()

      if (options.application_name)
        params.append("application_name", options.application_name)
      if (options.package_name)
        params.append("package_name", options.package_name)
      if (options.limit !== undefined)
        params.append("limit", options.limit.toString())
      if (options.offset !== undefined)
        params.append("offset", options.offset.toString())
      if (options.is_active !== undefined)
        params.append("is_active", options.is_active.toString())
      if (options.is_hidden !== undefined)
        params.append("is_hidden", options.is_hidden.toString())

      const url = `${baseUrl}/enterprise/${credentials.enterprise_id}/application/?${params}`
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(credentials.apiKey),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: EsperApplicationListResponse = await response.json()
      return data
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
      const url = `${baseUrl}/enterprise/${credentials.enterprise_id}/application/upload/`

      const formData = new FormData()
      formData.append("app_file", file)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
          // Don't set Content-Type header for FormData, let browser set it with boundary
        },
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`

        try {
          const errorData: EsperApiError = await response.json()
          if (errorData.errors && errorData.errors.length > 0) {
            // Extract the actual error message from the ErrorDetail string
            const firstError = errorData.errors[0]
            const match = firstError.match(/string='([^']+)'/)
            if (match && match[1]) {
              errorMessage = match[1]
            } else {
              errorMessage = errorData.message || firstError
            }
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (parseError) {
          // If we can't parse the error response, use the default message
          console.warn("Could not parse error response:", parseError)
        }

        throw new Error(errorMessage)
      }

      const data: EsperAppUploadResponse = await response.json()
      return data
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
      const url = `${baseUrl}/v1/enterprise/${credentials.enterprise_id}/`

      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(credentials.apiKey),
      })

      if (!response.ok) {
        let errorMessage = `Invalid credentials`

        if (response.status === 401) {
          errorMessage = "Invalid API key"
        } else if (response.status === 404) {
          errorMessage = "Invalid tenant ID or enterprise ID"
        } else if (response.status >= 400) {
          errorMessage = "Invalid credentials"
        }

        throw new Error(errorMessage)
      }

      const data: EsperCompanySettings = await response.json()
      return data
    } catch (error) {
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

      // Wait 5 seconds then launch Dolphin Store
      await new Promise((resolve) => setTimeout(resolve, 5000))
      await this.launchEsperLauncher(credentials, devices)

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

  async getAppVersions(
    credentials: EsperCredentials,
    applicationId: string,
    options: {
      version_code?: string
      build_number?: string
      is_enabled?: boolean
      is_default?: boolean
      approval_status?: "AVAILABLE" | "ACCEPTED" | "APPROVED" | "REJECTED"
      limit?: number
      offset?: number
      ordering?: string
    } = {},
  ): Promise<EsperAppVersionsResponse> {
    try {
      const baseUrl = this.getBaseUrl(credentials.tenant_id)
      const params = new URLSearchParams()

      if (options.version_code)
        params.append("version_code", options.version_code)
      if (options.build_number)
        params.append("build_number", options.build_number)
      if (options.is_enabled !== undefined)
        params.append("is_enabled", options.is_enabled.toString())
      if (options.is_default !== undefined)
        params.append("is_default", options.is_default.toString())
      if (options.approval_status)
        params.append("approval_status", options.approval_status)
      if (options.limit !== undefined)
        params.append("limit", options.limit.toString())
      if (options.offset !== undefined)
        params.append("offset", options.offset.toString())
      if (options.ordering) params.append("ordering", options.ordering)

      const url = `${baseUrl}/v1/enterprise/${credentials.enterprise_id}/application/${applicationId}/version/?${params}`
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(credentials.apiKey),
      })

      if (!response.ok) {
        throw new Error(`Failed to get app versions: ${response.status}`)
      }

      const data: EsperAppVersionsResponse = await response.json()
      return data
    } catch (error) {
      console.error("Error getting app versions:", error)
      throw error
    }
  }
}

export const esperApiService = new EsperApiService()
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
}
