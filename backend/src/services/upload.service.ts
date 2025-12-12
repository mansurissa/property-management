import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration for local storage
const localStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (allowedTypes: string[]) => {
  return (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  };
};

// Multer upload configurations
export const uploadImage = multer({
  storage: localStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES)
});

export const uploadDocument = multer({
  storage: localStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter([...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES])
});

export const uploadMultiple = multer({
  storage: localStorage,
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
  fileFilter: fileFilter([...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES])
});

// Upload file to Cloudinary
export const uploadToCloudinary = async (
  filePath: string,
  folder: string = 'maintenance'
): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      // Return local file path if Cloudinary is not configured
      const relativePath = filePath.replace(uploadsDir, '/uploads');
      return {
        success: true,
        url: relativePath,
        publicId: path.basename(filePath)
      };
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: `renta/${folder}`,
      resource_type: 'auto'
    });

    // Delete local file after uploading to Cloudinary
    fs.unlinkSync(filePath);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      // Delete local file
      const filePath = path.join(uploadsDir, publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    }

    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

// Upload multiple files
export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder: string = 'maintenance'
): Promise<{ success: boolean; files: Array<{ url: string; publicId: string; originalName: string }> }> => {
  const uploadedFiles: Array<{ url: string; publicId: string; originalName: string }> = [];

  for (const file of files) {
    const result = await uploadToCloudinary(file.path, folder);
    if (result.success && result.url && result.publicId) {
      uploadedFiles.push({
        url: result.url,
        publicId: result.publicId,
        originalName: file.originalname
      });
    }
  }

  return {
    success: uploadedFiles.length > 0,
    files: uploadedFiles
  };
};
