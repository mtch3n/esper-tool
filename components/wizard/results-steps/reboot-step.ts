import { esperApiService } from "@/lib/esper-api"
import type { StepContext, StepResult } from "./types"

export async function executeRebootStep(
  context: StepContext,
): Promise<StepResult> {
  const { selectedDevices, credentials } = context

  try {
    // Reboot all selected devices in a single API call
    const response = await esperApiService.rebootDevice(credentials, selectedDevices)

    return {
      success: true,
      message: `Successfully initiated reboot on ${selectedDevices.length} device(s)`,
    }
  } catch (error) {
    console.error("Reboot step failed:", error)
    return {
      success: false,
      message: "Reboot step failed due to unexpected error",
      error: error instanceof Error ? error : new Error("Unknown error"),
    }
  }
}
