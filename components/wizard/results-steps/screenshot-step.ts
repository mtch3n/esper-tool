import type { EsperCommandStatus } from "@/lib/esper-api"
import { esperApiService } from "@/lib/esper-api"

import type { StepContext, StepResult } from "./types"

export async function executeScreenshotStep(
  context: StepContext,
  setDeviceStatuses: (statuses: Map<string, EsperCommandStatus>) => void,
): Promise<StepResult> {
  const { selectedDevices, credentials, setCommandResponses } = context

  try {
    // Capture screenshots on all selected devices
    const commandResponse = await esperApiService.captureScreenshots(
      credentials,
      selectedDevices,
      "post-deployment-screenshot",
    )

    // Add command response to tracking
    setCommandResponses((prev) => [...prev, commandResponse])

    // Poll command status for screenshot completion with 10 minute timeout
    const timeoutMs = 10 * 60 * 1000 // 10 minutes timeout
    const pollInterval = 5000 // 5 seconds
    const startTime = Date.now()

    let commandComplete = false
    let allStatuses: EsperCommandStatus[] = []

    while (!commandComplete && Date.now() - startTime < timeoutMs) {
      try {
        // Check status for the screenshot command
        const statusResults = await esperApiService.getCommandStatus(
          credentials,
          commandResponse.id,
        )
        allStatuses = statusResults

        const statusMap = new Map<string, EsperCommandStatus>()
        allStatuses.forEach((status) => {
          statusMap.set(status.device, status)
        })
        setDeviceStatuses(statusMap)

        // Check if all commands are completed (reached final state)
        const finalStates = [
          "Command TimeOut",
          "Command Success",
          "Command Failure",
          "Command Scheduled",
          "Command Cancelled",
        ]
        const completedCount = allStatuses.filter((s) =>
          finalStates.includes(s.state),
        ).length

        if (completedCount === allStatuses.length) {
          // All commands completed - check for success
          const successCount = allStatuses.filter(
            (s) => s.state === "Command Success",
          ).length
          const failureCount = allStatuses.length - successCount

          commandComplete = true

          if (failureCount > 0) {
            const error = new Error(
              `Screenshot capture failed: ${failureCount} command(s) failed out of ${allStatuses.length} total`,
            )
            error.name = "ScreenshotFailure"
            ;(error as any).details = {
              message: `Screenshot capture failed: ${failureCount} of ${allStatuses.length} command(s) failed`,
              rawResponse: allStatuses,
              successCount,
              failureCount,
              commandId: commandResponse.id,
            }
            throw error
          }

          // Wait 15 seconds to allow screenshots to be fully processed
          await new Promise((resolve) => setTimeout(resolve, 15000))

          return {
            success: true,
            message: `Screenshot capture completed successfully: ${successCount}/${allStatuses.length} device(s) captured screenshots`,
          }
        } else {
          // Still in progress, wait before next poll
          await new Promise((resolve) => setTimeout(resolve, pollInterval))
        }
      } catch (error) {
        if (Date.now() - startTime >= timeoutMs) {
          throw new Error(
            `Screenshot capture timeout: Commands did not complete after 10 minutes`,
          )
        }
        throw error
      }
    }

    if (!commandComplete) {
      throw new Error(
        `Screenshot capture timeout: Commands did not complete after 10 minutes`,
      )
    }

    // Wait 15 seconds to allow screenshots to be fully processed
    await new Promise((resolve) => setTimeout(resolve, 15000))

    return {
      success: true,
      message: "Screenshot capture completed",
    }
  } catch (error) {
    console.error("Screenshot step failed:", error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unknown error occurred during screenshot capture",
      error:
        error instanceof Error ? error : new Error("Unknown screenshot error"),
    }
  }
}
