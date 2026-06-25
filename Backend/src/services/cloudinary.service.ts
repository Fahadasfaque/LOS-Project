import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import crypto from 'crypto';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export class CloudinaryService {
  /**
   * Uploads a file buffer directly to Cloudinary without storing it locally.
   * @param fileBuffer The file buffer
   * @param applicationId Application ID for folder organization
   * @param documentType Document type for folder organization
   * @returns Cloudinary UploadApiResponse
   */
  async uploadDocument(
    fileBuffer: Buffer,
    applicationId: string,
    documentType: string,
    originalFilename: string
  ): Promise<UploadApiResponse> {
    const fileExtension = originalFilename.split('.').pop() || '';
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const publicId = `${documentType.toLowerCase()}_${uniqueId}`;
    const folder = `los/applications/${applicationId}/${documentType.toLowerCase()}`;

    return new Promise((resolve, reject) => {
      const options: UploadApiOptions = {
        folder,
        public_id: publicId,
        resource_type: 'auto',
        use_filename: false,
        unique_filename: false,
      };

      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error('Unknown Cloudinary upload error'));
        }
      });

      stream.end(fileBuffer);
    });
  }

  /**
   * Deletes a document from Cloudinary by its public ID.
   * @param publicId Cloudinary public ID
   */
  async deleteDocument(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

export const cloudinaryService = new CloudinaryService();
