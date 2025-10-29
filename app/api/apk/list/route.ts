import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const apkDir = path.join(process.cwd(), "public", "apk")

    // Check if directory exists
    try {
      await fs.access(apkDir)
    } catch {
      return NextResponse.json({ files: [] })
    }

    const files = await fs.readdir(apkDir)

    // Filter for .apk files and get their stats
    const apkFiles = await Promise.all(
      files
        .filter((file) => file.endsWith(".apk"))
        .map(async (file) => {
          const filePath = path.join(apkDir, file)
          const stats = await fs.stat(filePath)
          return {
            name: file,
            size: stats.size,
            path: `/apk/${file}`,
          }
        })
    )

    return NextResponse.json({ files: apkFiles })
  } catch (error) {
    console.error("Error reading APK directory:", error)
    return NextResponse.json(
      { error: "Failed to read APK files" },
      { status: 500 }
    )
  }
}
