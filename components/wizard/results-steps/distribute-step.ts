import { esperApiService } from "@/lib/esper-api"

import type { StepContext, StepResult } from "./types"

export async function executeDistributeStep(
  context: StepContext,
): Promise<StepResult> {
  const {
    selectedDevices,
    selectedApplications,
    selectedAppVersions,
    credentials,
    setCommandResponses,
  } = context

  try {
    // Deploy apps to devices using Esper API (bulk deployment)
    if (selectedApplications.length > 0) {
      // Deploy all selected applications using bulk commands
      const deploymentResults: string[] = []

      for (const appId of selectedApplications) {
        let versionId: string

        // Get version ID from the selectedAppVersions map if available
        if (selectedAppVersions && selectedAppVersions.has(appId)) {
          versionId = selectedAppVersions.get(appId)!
        } else {
          // Fallback: if appId is actually a version ID (backward compatibility)
          if (typeof appId === "string" && appId.includes("-")) {
            versionId = appId
          } else {
            throw new Error(
              `No version selected for app ${appId}. Please select a version in the app selection step.`,
            )
          }
        }

        console.log(
          "Deploying app",
          appId,
          "with version_id:",
          versionId,
          "to",
          selectedDevices.length,
          "devices using bulk deployment",
        )

        // Use bulk deployment - pass all devices to single command
        const response = await esperApiService.deployAppToDevices(
          credentials,
          selectedDevices, // All devices in bulk
          versionId,
        )

        // Store all command responses for monitoring
        setCommandResponses((prev) => [...prev, response])

        deploymentResults.push(
          `App ${appId} (version ${versionId}) bulk deployed to ${selectedDevices.length} device(s)`,
        )
      }

      return {
        success: true,
        message: `Bulk deployed ${selectedApplications.length} application(s) to ${selectedDevices.length} device(s): ${deploymentResults.join("; ")}`,
      }
    } else {
      return {
        success: true,
        message: "No applications to distribute",
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Distribution failed",
      error: error instanceof Error ? error : new Error("Distribution failed"),
    }
  }
}
