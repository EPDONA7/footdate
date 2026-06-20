// src/app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://footdate.live',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}