import { esperApiService } from "@/lib/esper-api"

import type { StepContext, StepResult } from "./types"

export async function executeEnableStep(
  context: StepContext,
): Promise<StepResult> {
  const {
    selectedDevices,
    selectedApplicationsData,
    selectedAppVersions,
    credentials,
    setCommandResponses,
  } = context

  try {
    if (selectedApplicationsData && selectedApplicationsData.size > 0) {
      console.log(
        "Enabling apps:",
        Array.from(selectedApplicationsData.values()).map(
          (app) => app.application_name,
        ),
        "on",
        selectedDevices.length,
        "devices",
      )

      // Enable all apps using SET_APP_STATE commands
      const responses = await esperApiService.enableAppsOnDevices(
        credentials,
        selectedDevices,
        selectedApplicationsData,
        selectedAppVersions || new Map(),
      )

      // Store command responses for monitoring
      setCommandResponses((prev) => [...prev, ...responses])

      const appNames = Array.from(selectedApplicationsData.values())
        .map((app) => app.application_name)
        .join(", ")

      return {
        success: true,
        message: `Successfully enabled ${selectedApplicationsData.size} app(s) (${appNames}) on ${selectedDevices.length} device(s)`,
      }
    }

    return {
      success: true,
      message: "No apps to enable",
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Enable failed",
      error: error instanceof Error ? error : new Error("Enable failed"),
    }
  }
}
