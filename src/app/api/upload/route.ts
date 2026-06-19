import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk"
import { uploadImage, getCloudinaryConfigError } from "@/lib/cloudinary"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const configError = getCloudinaryConfigError()
    if (configError) {
      console.error("Cloudinary config error:", configError)
      return NextResponse.json({ error: configError }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "uploads"

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "The selected file is empty" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a JPEG, PNG, WEBP or GIF image." },
        { status: 400 }
      )
    }

    const result = await uploadImage(file, folder)

    return NextResponse.json({
      url: result.secure_url,
      secure_url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload image"
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
