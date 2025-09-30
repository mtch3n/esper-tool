import { esperApiService } from "@/lib/esper-api"

import type { StepContext, StepResult } from "./types"

export async function executeValidateStep(
  context: StepContext,
): Promise<StepResult> {
  const { selectedDevices, selectedApplicationsData, credentials } = context

  try {
    // Validate apps are actually present on devices by checking package names
    if (selectedApplicationsData && selectedApplicationsData.size > 0) {
      const timeoutMs = 5 * 60 * 1000 // 5 minutes timeout for validation
      const pollInterval = 10000 // 10 seconds
      const startTime = Date.now()

      let allAppsValidated = false

      while (!allAppsValidated && Date.now() - startTime < timeoutMs) {
        try {
          // Get expected package names
          const expectedPackages = Array.from(
            selectedApplicationsData.values(),
          ).map((app) => app.package_name)

          // Check each device for all expected packages
          const deviceValidationPromises = selectedDevices.map(
            async (deviceId) => {
              try {
                const deviceApps = await esperApiService.getDeviceApps(
                  credentials,
                  deviceId,
                )
                const installedPackages = new Set(
                  deviceApps.map((app) => app.package_name),
                )

                const missingPackages = expectedPackages.filter(
                  (pkg) => !installedPackages.has(pkg),
                )

                return {
                  deviceId,
                  allPresent: missingPackages.length === 0,
                  missingPackages,
                  installedCount:
                    expectedPackages.length - missingPackages.length,
                }
              } catch (error) {
                console.error(
                  `Error validating apps on device ${deviceId}:`,
                  error,
                )
                return {
                  deviceId,
                  allPresent: false,
                  missingPackages: expectedPackages,
                  installedCount: 0,
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              }
            },
          )

          const validationResults = await Promise.all(deviceValidationPromises)

          const successfulDevices = validationResults.filter(
            (result) => result.allPresent,
          )
          const failedDevices = validationResults.filter(
            (result) => !result.allPresent,
          )

          if (successfulDevices.length === selectedDevices.length) {
            // All devices have all apps
            allAppsValidated = true
            return {
              success: true,
              message: `Validation completed: All ${expectedPackages.length} app(s) verified on ${selectedDevices.length} device(s)`,
            }
          } else {
            // Some devices still missing apps, check if we should timeout
            if (Date.now() - startTime >= timeoutMs) {
              const error = new Error(
                `Validation failed: Apps not found on ${failedDevices.length} device(s) after 5 minutes`,
              )
              error.name = "ValidationTimeout"
              ;(error as any).details = {
                message: `App validation failed on ${failedDevices.length}/${selectedDevices.length} device(s)`,
                failedDevices: failedDevices.map((d) => ({
                  deviceId: d.deviceId,
                  missingPackages: d.missingPackages,
                  installedCount: d.installedCount,
                  error: (d as any).error,
                })),
                expectedPackages,
              }
              throw error
            }

            // Wait before next check
            await new Promise((resolve) => setTimeout(resolve, pollInterval))
          }
        } catch (error) {
          if (Date.now() - startTime >= timeoutMs) {
            throw new Error(
              `Validation timeout: Could not verify app presence after 5 minutes`,
            )
          }
          throw error
        }
      }

      if (!allAppsValidated) {
        throw new Error(`Validation timeout: Apps not verified after 5 minutes`)
      }
    }

    return {
      success: true,
      message: "App validation skipped - no app data available",
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Validation failed",
      error: error instanceof Error ? error : new Error("Validation failed"),
    }
  }
}
