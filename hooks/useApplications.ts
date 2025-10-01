import { useCallback, useEffect, useState } from "react"
import {
  esperApiService,
  EsperApplication,
  EsperApplicationVersion,
  EsperCredentials,
} from "@/lib/esper-api"

interface UseApplicationsOptions {
  limit?: number
  onKaiduScannerFound?: (appId: string) => void
}

interface UseApplicationsResult {
  applications: EsperApplication[]
  selectedApplications: Set<string>
  selectedAppVersions: Map<string, string> // appId -> versionId
  appVersions: Map<string, EsperApplicationVersion[]> // appId -> versions
  loadingVersions: Set<string> // appIds currently loading versions
  loading: boolean
  error: string | null
  searchTerm: string
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean

  // Actions
  setSearchTerm: (term: string) => void
  setCurrentPage: (page: number) => void
  toggleApplicationSelection: (appId: string) => void
  selectAllApplications: () => void
  clearAllSelections: () => void
  loadApplications: (credentials: EsperCredentials) => Promise<void>
  searchApplications: (
    credentials: EsperCredentials,
    searchTerm: string,
  ) => Promise<void>
  refreshApplications: (credentials: EsperCredentials) => Promise<void>
  loadAppVersions: (
    credentials: EsperCredentials,
    appId: string,
    forceRefetch?: boolean,
  ) => Promise<void>
  setSelectedAppVersion: (appId: string, versionId: string) => void
}

export function useApplications(
  options: UseApplicationsOptions = {},
): UseApplicationsResult {
  const { limit = 20, onKaiduScannerFound } = options

  const [applications, setApplications] = useState<EsperApplication[]>([])
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(
    new Set(),
  )
  const [selectedAppVersions, setSelectedAppVersions] = useState<
    Map<string, string>
  >(new Map())
  const [appVersions, setAppVersions] = useState<
    Map<string, EsperApplicationVersion[]>
  >(new Map())
  const [loadingVersions, setLoadingVersions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const totalPages = Math.ceil(totalCount / limit)
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1
  const offset = (currentPage - 1) * limit

  const loadApplications = useCallback(
    async (credentials: EsperCredentials) => {
      setLoading(true)
      setError(null)
      try {
        const response = await esperApiService.getApplications(credentials, {
          limit,
          offset,
          is_active: true,
          is_hidden: false,
        })

        setApplications(response.results)
        setTotalCount(response.count)

        // Preload versions for all applications
        const loadVersionPromises = response.results.map(async (app) => {
          try {
            const versionsResponse = await esperApiService.getAppVersions(
              credentials,
              app.id,
              {
                is_enabled: true,
                ordering: "-created_on", // Latest versions first
              },
            )

            setAppVersions((prev) =>
              new Map(prev).set(app.id, versionsResponse.results),
            )

            // Set default version to the first (latest) version if none selected
            if (versionsResponse.results.length > 0) {
              setSelectedAppVersions((prev) => {
                if (!prev.has(app.id)) {
                  return new Map(prev).set(
                    app.id,
                    versionsResponse.results[0].id,
                  )
                }
                return prev
              })
            }
          } catch (err) {
            console.error(`Error preloading versions for app ${app.id}:`, err)
          }
        })

        // Wait for all version loading to complete
        await Promise.all(loadVersionPromises)

        // Check for Kaidu Scanner and trigger callback if found
        const kaiduScannerApp = response.results.find(
          (app) =>
            app.package_name.toLowerCase().includes("kaidu") ||
            app.application_name.toLowerCase().includes("kaidu") ||
            app.package_name.toLowerCase().includes("scanner") ||
            app.application_name.toLowerCase().includes("scanner"),
        )

        if (kaiduScannerApp && onKaiduScannerFound) {
          onKaiduScannerFound(kaiduScannerApp.id)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load applications"
        setError(errorMessage)
        console.error("Error loading applications:", err)
      } finally {
        setLoading(false)
      }
    },
    [limit, offset],
  )

  const searchApplications = useCallback(
    async (credentials: EsperCredentials, searchTerm: string) => {
      setLoading(true)
      setError(null)
      try {
        const response = await esperApiService.getApplications(credentials, {
          application_name: searchTerm,
          limit,
          offset,
          is_active: true,
          is_hidden: false,
        })

        setApplications(response.results)
        setTotalCount(response.count)

        // Preload versions for all search results
        const loadVersionPromises = response.results.map(async (app) => {
          try {
            const versionsResponse = await esperApiService.getAppVersions(
              credentials,
              app.id,
              {
                is_enabled: true,
                ordering: "-created_on", // Latest versions first
              },
            )

            setAppVersions((prev) =>
              new Map(prev).set(app.id, versionsResponse.results),
            )

            // Set default version to the first (latest) version if none selected
            if (versionsResponse.results.length > 0) {
              setSelectedAppVersions((prev) => {
                if (!prev.has(app.id)) {
                  return new Map(prev).set(
                    app.id,
                    versionsResponse.results[0].id,
                  )
                }
                return prev
              })
            }
          } catch (err) {
            console.error(`Error preloading versions for app ${app.id}:`, err)
          }
        })

        // Wait for all version loading to complete
        await Promise.all(loadVersionPromises)

        // Check for Kaidu Scanner and trigger callback if found
        const kaiduScannerApp = response.results.find(
          (app) =>
            app.package_name.toLowerCase().includes("kaidu") ||
            app.application_name.toLowerCase().includes("kaidu") ||
            app.package_name.toLowerCase().includes("scanner") ||
            app.application_name.toLowerCase().includes("scanner"),
        )

        if (kaiduScannerApp && onKaiduScannerFound) {
          onKaiduScannerFound(kaiduScannerApp.id)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to search applications"
        setError(errorMessage)
        console.error("Error searching applications:", err)
      } finally {
        setLoading(false)
      }
    },
    [limit, offset],
  )

  const refreshApplications = useCallback(
    async (credentials: EsperCredentials) => {
      if (searchTerm) {
        await searchApplications(credentials, searchTerm)
      } else {
        await loadApplications(credentials)
      }
    },
    [searchTerm, loadApplications, searchApplications],
  )

  const toggleApplicationSelection = useCallback((appId: string) => {
    setSelectedApplications((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(appId)) {
        newSet.delete(appId)
      } else {
        newSet.add(appId)
      }
      return newSet
    })
  }, [])

  const selectAllApplications = useCallback(() => {
    const allAppIds = new Set(applications.map((app) => app.id))
    setSelectedApplications(allAppIds)
  }, [applications])

  const clearAllSelections = useCallback(() => {
    setSelectedApplications(new Set())
    setSelectedAppVersions(new Map())
  }, [])

  const loadAppVersions = useCallback(
    async (
      credentials: EsperCredentials,
      appId: string,
      forceRefetch = false,
    ) => {
      if (
        !forceRefetch &&
        (appVersions.has(appId) || loadingVersions.has(appId))
      ) {
        return // Already loaded or loading
      }

      setLoadingVersions((prev) => new Set(prev).add(appId))

      try {
        const response = await esperApiService.getAppVersions(
          credentials,
          appId,
          {
            is_enabled: true,
            ordering: "-created_on", // Latest versions first
          },
        )

        setAppVersions((prev) => new Map(prev).set(appId, response.results))

        // Set default version to the first (latest) version if none selected
        if (response.results.length > 0 && !selectedAppVersions.has(appId)) {
          setSelectedAppVersions((prev) =>
            new Map(prev).set(appId, response.results[0].id),
          )
        }
      } catch (err) {
        console.error(`Error loading versions for app ${appId}:`, err)
      } finally {
        setLoadingVersions((prev) => {
          const newSet = new Set(prev)
          newSet.delete(appId)
          return newSet
        })
      }
    },
    [appVersions, loadingVersions, selectedAppVersions],
  )

  const setSelectedAppVersion = useCallback(
    (appId: string, versionId: string) => {
      setSelectedAppVersions((prev) => new Map(prev).set(appId, versionId))
    },
    [],
  )

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return {
    applications,
    selectedApplications,
    selectedAppVersions,
    appVersions,
    loadingVersions,
    loading,
    error,
    searchTerm,
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPreviousPage,

    // Actions
    setSearchTerm,
    setCurrentPage,
    toggleApplicationSelection,
    selectAllApplications,
    clearAllSelections,
    loadApplications,
    searchApplications,
    refreshApplications,
    loadAppVersions,
    setSelectedAppVersion,
  }
}
