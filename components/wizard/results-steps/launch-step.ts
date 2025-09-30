import { esperApiService } from "@/lib/esper-api"
import type { StepContext, StepResult } from "./types"

export async function executeLaunchStep(
  context: StepContext,
  launchApps: string[],
): Promise<StepResult> {
  const {
    selectedDevices,
    selectedApplicationsData,
    credentials,
    setCommandResponses,
  } = context

  try {
    if (launchApps.length > 0 && selectedApplicationsData) {
      // Filter applications data to only include apps that should be launched
      const launchAppsData = new Map<
        string,
        { package_name: string; application_name: string }
      >()
      launchApps.forEach((appId) => {
        const appData = selectedApplicationsData.get(appId)
        if (appData) {
          launchAppsData.set(appId, appData)
        }
      })

      if (launchAppsData.size > 0) {
        console.log(
          "Launching apps:",
          Array.from(launchAppsData.values()).map(
            (app) => app.application_name,
          ),
          "on",
          selectedDevices.length,
          "devices",
        )

        // Launch all apps using bulk commands
        const responses = await esperApiService.launchAppsOnDevices(
          credentials,
          selectedDevices,
          launchAppsData,
        )

        // Store command responses for monitoring
        setCommandResponses((prev) => [...prev, ...responses])

        const appNames = Array.from(launchAppsData.values())
          .map((app) => app.application_name)
          .join(", ")

        return {
          success: true,
          message: `Successfully launched ${launchAppsData.size} app(s) (${appNames}) on ${selectedDevices.length} device(s)`,
        }
      } else {
        return {
          success: true,
          message: "No app data available for launch",
        }
      }
    }

    return {
      success: true,
      message: "No apps selected for launch",
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Launch failed",
      error: error instanceof Error ? error : new Error("Launch failed"),
    }
  }
}
