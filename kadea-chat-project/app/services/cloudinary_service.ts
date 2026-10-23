import { v2 as cloudinary } from 'cloudinary'
import env from '#start/env'

cloudinary.config({
  cloud_name: env.get('CLOUDINARY_CLOUD_NAME'),
  api_key: env.get('CLOUDINARY_API_KEY'),
  api_secret: env.get('CLOUDINARY_API_SECRET').release(),
  secure: true,
})

export default class CloudinaryService {
  static async uploadAvatar(filePath: string, userId: number) {
    return cloudinary.uploader.upload(filePath, {
      folder: 'kadea-chat/avatars',
      public_id: `user_${userId}`,
      overwrite: true,
      invalidate: true,
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    })
  }
}