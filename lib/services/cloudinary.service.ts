// NEW FILE: Cloudinary service for document and image uploads
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  static async uploadDocument(file: Buffer, fileName: string, userId: string) {
    try {
      const result = await cloudinary.uploader.upload(
        `data:application/pdf;base64,${file.toString('base64')}`,
        {
          folder: `sba-grants/documents/${userId}`,
          public_id: fileName,
          resource_type: 'raw',
          format: 'pdf'
        }
      );
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: fileName,
        size: result.bytes,
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload document');
    }
  }

  static async uploadAvatar(file: Buffer, userId: string) {
    try {
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${file.toString('base64')}`,
        {
          folder: `sba-grants/avatars`,
          public_id: `avatar_${userId}`,
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        }
      );
      
      return result.secure_url;
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw new Error('Failed to upload avatar');
    }
  }

  static async deleteFile(publicId: string) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
    }
  }
}