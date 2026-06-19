import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder,
      },
      (error: unknown, result: unknown) => {
        if (error) reject(error)
        else resolve(result as CloudinaryUploadResponse)
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
