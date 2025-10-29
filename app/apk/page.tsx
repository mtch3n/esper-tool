"use client"

import { useEffect, useState } from "react"
import { Download, Package, FileWarning } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApkFile {
  name: string
  size: number
  path: string
}

export default function ApkPage() {
  const [apkFiles, setApkFiles] = useState<ApkFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApkFiles()
  }, [])

  const fetchApkFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/apk/list")
      if (!response.ok) {
        throw new Error("Failed to fetch APK files")
      }
      const data = await response.json()
      setApkFiles(data.files)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const handleDownload = (apkFile: ApkFile) => {
    const link = document.createElement("a")
    link.href = apkFile.path
    link.download = apkFile.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <FileWarning className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading APK files...</div>
          </div>
        ) : apkFiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No APK files found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {apkFiles.map((apkFile) => (
              <Card key={apkFile.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg break-all">
                    {apkFile.name}
                  </CardTitle>
                  <CardDescription>
                    Size: {formatFileSize(apkFile.size)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleDownload(apkFile)}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
