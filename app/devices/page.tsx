"use client"

import { DeviceList } from "@/components/devices/device-list"

export default function DevicesPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <DeviceList />
      </div>
    </div>
  )
}
