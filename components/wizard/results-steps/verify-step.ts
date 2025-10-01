import { esperApiService, type EsperCommandStatus } from "@/lib/esper-api"

import type { StepContext, StepResult } from "./types"

export async function executeVerifyStep(
  context: StepContext,
  setDeviceStatuses: (statuses: Map<string, EsperCommandStatus>) => void,
): Promise<StepResult> {
  const { commandResponses, credentials } = context

  try {
    // Verify deployment success using command status polling for all commands
    if (commandResponses.length > 0) {
      const timeoutMs = 10 * 60 * 1000 // 10 minutes timeout
      const pollInterval = 5000 // 5 seconds
      const startTime = Date.now()

      let allCommandsComplete = false
      let allStatuses: EsperCommandStatus[] = []

      while (!allCommandsComplete && Date.now() - startTime < timeoutMs) {
        try {
          // Check status for all command responses
          const allStatusPromises = commandResponses.map((cmdResponse) =>
            esperApiService.getCommandStatus(credentials, cmdResponse.id),
          )

          const statusArrays = await Promise.all(allStatusPromises)
          allStatuses = statusArrays.flat() // Flatten all status arrays

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

            allCommandsComplete = true

            if (failureCount > 0) {
              const error = new Error(
                `Installation failed: ${failureCount} command(s) failed out of ${allStatuses.length} total`,
              )
              error.name = "DeploymentFailure"
              ;(error as any).details = {
                message: `Installation failed: ${failureCount} of ${allStatuses.length} command(s) failed`,
                rawResponse: allStatuses,
                successCount,
                failureCount,
                totalCommands: commandResponses.length,
                commandIds: commandResponses.map((cmd) => cmd.id),
              }
              throw error
            }

            return {
              success: true,
              message: `Verification completed successfully: ${successCount}/${allStatuses.length} command(s) succeeded across ${commandResponses.length} deployment(s)`,
            }
          } else {
            // Still in progress, wait before next poll
            await new Promise((resolve) => setTimeout(resolve, pollInterval))
          }
        } catch (error) {
          if (Date.now() - startTime >= timeoutMs) {
            throw new Error(
              `Verification timeout: Commands did not complete after 10 minutes`,
            )
          }
          throw error
        }
      }

      if (!allCommandsComplete) {
        throw new Error(
          `Verification timeout: Commands did not complete after 10 minutes`,
        )
      }
    }

    return {
      success: true,
      message: "No command responses available for verification",
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Verification failed",
      error: error instanceof Error ? error : new Error("Verification failed"),
    }
  }
}
