import type { EsperCommandResponse, EsperCredentials } from "@/lib/esper-api"

export interface StepContext {
  selectedDevices: string[]
  selectedApplications: string[]
  selectedAppVersions?: Map<string, string>
  selectedApplicationsData?: Map<
    string,
    { package_name: string; application_name: string }
  >
  credentials: EsperCredentials
  commandResponses: EsperCommandResponse[]
  setCommandResponses: (
    updater: (prev: EsperCommandResponse[]) => EsperCommandResponse[],
  ) => void
}

export interface StepResult {
  success: boolean
  message: string
  error?: Error
}

export type StepFunction = (context: StepContext) => Promise<StepResult>
