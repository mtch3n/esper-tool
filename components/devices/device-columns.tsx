"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DeviceAppsDisplay } from "@/components/devices/device-apps-display"
import type { EsperDevice } from "@/lib/esper-api"
import { getDeviceStatusInfo } from "@/lib/esper-api"

const getDeviceStateBadge = (state: number) => {
  const stateInfo = getDeviceStatusInfo(state)
  return (
    <div className={stateInfo.color + " rounded px-2 py-1 text-xs font-medium"}>
      {stateInfo.label}
    </div>
  )
}

const formatLastSeen = (lastSeen?: string) => {
  if (!lastSeen) return "Never"

  const lastSeenDate = new Date(lastSeen)
  const now = new Date()
  const diffInHours = Math.floor(
    (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60),
  )

  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return lastSeenDate.toLocaleDateString()
}

export const deviceColumns: ColumnDef<EsperDevice>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Device Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const device = row.original

      const handleNameClick = async () => {
        try {
          await navigator.clipboard.writeText(device.name || "Unknown Device")
          toast.success("Device name copied to clipboard")
        } catch (err) {
          console.error("Failed to copy device name:", err)
          toast.error("Failed to copy device name")
        }
      }

      const handleIdClick = async () => {
        try {
          await navigator.clipboard.writeText(device.id)
          toast.success("Device ID copied to clipboard")
        } catch (err) {
          console.error("Failed to copy device ID:", err)
          toast.error("Failed to copy device ID")
        }
      }

      return (
        <div>
          <div
            className="cursor-pointer font-medium transition-colors hover:text-blue-600"
            onClick={handleNameClick}
            title="Click to copy device name"
          >
            {device.name || "Unknown Device"}
          </div>
          <div
            className="cursor-pointer font-mono text-xs text-gray-500 transition-colors hover:text-blue-600"
            onClick={handleIdClick}
            title="Click to copy device ID"
          >
            {device.id}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "alias",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Alias
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.alias || "-"}</div>
    },
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => {
      const device = row.original
      return getDeviceStateBadge(device.state)
    },
    filterFn: (row, id, value) => {
      const device = row.original
      const stateInfo = getDeviceStatusInfo(device.state)
      return value.includes(stateInfo.label.toLowerCase())
    },
  },
  {
    accessorKey: "serial",
    header: "Serial",
    cell: ({ row }) => {
      const handleSerialClick = async () => {
        try {
          await navigator.clipboard.writeText(row.original.serial || "Unknown")
          toast.success("Serial number copied to clipboard")
        } catch (err) {
          console.error("Failed to copy serial number:", err)
          toast.error("Failed to copy serial number")
        }
      }

      return (
        <div
          className="cursor-pointer font-mono text-xs transition-colors hover:text-blue-600"
          onClick={handleSerialClick}
          title="Click to copy serial number"
        >
          {row.original.serial || "Unknown"}
        </div>
      )
    },
  },
  {
    id: "apps",
    header: "Apps",
    cell: ({ row }) => {
      return <DeviceAppsDisplay deviceId={row.original.id} />
    },
  },
  {
    accessorKey: "last_seen",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Last Seen
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return formatLastSeen(row.original.last_seen)
    },
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.last_seen
        ? new Date(rowA.original.last_seen).getTime()
        : 0
      const dateB = rowB.original.last_seen
        ? new Date(rowB.original.last_seen).getTime()
        : 0
      return dateA - dateB
    },
  },
]
