"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CredentialsForm } from "@/components/credentials-form"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Esper Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              <CredentialsForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
