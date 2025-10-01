import type { EsperCommandStatus, EsperCredentials } from "@/lib/esper-api"

export interface StepDeviceStatus {
  deviceStatuses: Map<string, EsperCommandStatus>
  summary?: {
    successful: number
    failed: number
    inProgress: number
  }
}

export interface StepError {
  message: string
  technicalDetails?: string
  isExpanded?: boolean
}

export interface DeploymentStep {
  id: string
  title: string
  status: "pending" | "running" | "completed" | "failed"
  timestamp?: string
  details?: string
  deviceStatus?: StepDeviceStatus
  error?: StepError
  expectedOutput?: string
}

export interface DeploymentStepCardProps {
  step: DeploymentStep
  index: number
  isCanceled: boolean
  isExpanded: boolean
  devices: any[]
  onToggleExpansion: () => void
  onRetry: () => void
  onToggleErrorExpansion: () => void
}

export interface DeviceCardProps {
  deviceId: string
  device: any
  isExpanded: boolean
  launchApps: string[]
  onToggleExpansion: () => void
  variant: "success" | "failed"
  deviceStatus?: EsperCommandStatus
}

export interface ResultsHeaderProps {
  isComplete: boolean
  hasFailed: boolean
  selectedDevices: string[]
  devices?: any[]
  onViewScreenshots?: () => void
}
