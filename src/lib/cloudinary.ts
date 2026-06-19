import { v2 as cloudinary } from 'cloudinary'

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
})

export function getCloudinaryConfigError(): string | null {
  const missing: string[] = []
  if (!cloudName) missing.push('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME')
  if (!apiKey) missing.push('CLOUDINARY_API_KEY')
  if (!apiSecret) missing.push('CLOUDINARY_API_SECRET')
  if (missing.length > 0) {
    return `Cloudinary is not configured. Missing environment variable(s): ${missing.join(', ')}`
  }
  return null
}

interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  [key: string]: any
}

interface CloudinaryDeleteResponse {
  result: string
  [key: string]: any
}

export async function uploadImage(file: File, folder: string = 'footdate'): Promise<CloudinaryUploadResponse> {
  const configError = getCloudinaryConfigError()
  if (configError) {
    throw new Error(configError)
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder,
      },
      (error: unknown, result: unknown) => {
        if (error) {
          const message = error instanceof Error ? error.message : JSON.stringify(error)
          reject(new Error(message))
        } else if (!result) {
          reject(new Error('Cloudinary returned an empty response'))
        } else {
          resolve(result as CloudinaryUploadResponse)
        }
      }
    ).end(buffer)
  })
}

export async function deleteImage(publicId: string): Promise<CloudinaryDeleteResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error: unknown, result: unknown) => {
      if (error) reject(error)
      else resolve(result as CloudinaryDeleteResponse)
    })
  })
}
