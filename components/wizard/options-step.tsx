import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface OptionsStepProps {
  selectedDevices: string[]
  devices: any[]
  rebootAfterDeploy: boolean
  onRebootAfterDeployChange: (checked: boolean) => void
}

export function OptionsStep({
  selectedDevices,
  devices,
  rebootAfterDeploy,
  onRebootAfterDeployChange,
}: OptionsStepProps) {
  return (
    <div className="space-y-6">
      {/* Options */}
      <div className="space-y-4">
        {/* Reboot Option */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="reboot-after-deploy"
            checked={rebootAfterDeploy}
            onCheckedChange={(checked) =>
              onRebootAfterDeployChange(checked === true)
            }
            className="mt-1"
          />
          <div className="space-y-1">
            <Label
              htmlFor="reboot-after-deploy"
              className="cursor-pointer text-sm font-medium text-gray-900"
            >
              Reboot devices after deployment
            </Label>
            <p className="text-xs text-gray-500">
              Recommended to ensure all changes take effect properly. Devices
              will restart automatically after deployment completes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
