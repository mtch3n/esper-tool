import { esperApiService } from "@/lib/esper-api"
import type { StepContext, StepResult } from "./types"

export async function executeLauncherStep(
  context: StepContext,
): Promise<StepResult> {
  const { selectedDevices, credentials, setCommandResponses } = context

  try {
    console.log(
      "Launching Esper Launcher on",
      selectedDevices.length,
      "devices",
    )

    // Launch Esper Launcher on all selected devices
    const response = await esperApiService.launchEsperLauncher(
      credentials,
      selectedDevices,
    )

    // Store command response for monitoring
    setCommandResponses((prev) => [...prev, response])

    // Wait 15 seconds to allow Esper Launcher to fully load
    await new Promise((resolve) => setTimeout(resolve, 15000))

    return {
      success: true,
      message: `Successfully launched Esper Launcher on ${selectedDevices.length} device(s)`,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Launcher step failed",
      error: error instanceof Error ? error : new Error("Launcher step failed"),
    }
  }
}
