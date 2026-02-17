import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

/**
 * UploadThing Configuration
 * 
 * Required Environment Variables:
 * - UPLOADTHING_SECRET: Your UploadThing secret key (get from https://uploadthing.com/dashboard)
 * - UPLOADTHING_APP_ID: Your UploadThing app ID (optional, used for custom domains)
 * 
 * File size limits: 4MB per file
 * Supported formats: Images only (jpg, jpeg, png, webp)
 */

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // Authentication is handled in the route handler
      // This middleware can be used for additional validation
      return {};
    })
    .onUploadComplete(async ({ metadata, file }: { metadata?: { userId?: string; updateProfile?: boolean }, file: { url: string } }) => {
      console.log('Upload complete');
      console.log('file url', file.url);

      // Optional: update user's profile image automatically when requested.
      // The server-side upload route should supply server-verified `userId` in metadata.
      try {
        if (metadata?.userId && metadata?.updateProfile) {
          // Import prisma lazily to avoid circular/edge issues
          const { prisma } = await import('@/lib/prisma');

          // Verify user exists before updating
          const user = await prisma.user.findUnique({ where: { id: metadata.userId } });
          if (user) {
            // Basic sanitization: ensure URL is https and not excessively long
            if (typeof file.url === 'string' && file.url.startsWith('https://') && file.url.length < 2000) {
              await prisma.user.update({
                where: { id: metadata.userId },
                data: { profileImage: file.url },
              });
            } else {
              console.warn('Uploaded file URL failed basic sanitization, skipping profile update');
            }
          }
        }
      } catch (err) {
        console.error('Failed to update user profile from upload:', err);
      }

      return { uploadedBy: metadata?.userId };
    }),
  
  multipleImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      // Authentication is handled in the route handler
      // This middleware can be used for additional validation
      return {};
    })
    .onUploadComplete(async ({ metadata, file }: { metadata?: { userId?: string; updateProfile?: boolean }, file: { url: string } }) => {
      console.log('Upload complete');
      console.log('file url', file.url);

      try {
        if (metadata?.userId && metadata?.updateProfile) {
          const { prisma } = await import('@/lib/prisma');
          const user = await prisma.user.findUnique({ where: { id: metadata.userId } });
          if (user) {
            if (typeof file.url === 'string' && file.url.startsWith('https://') && file.url.length < 2000) {
              await prisma.user.update({
                where: { id: metadata.userId },
                data: { profileImage: file.url },
              });
            } else {
              console.warn('Uploaded file URL failed basic sanitization, skipping profile update');
            }
          }
        }
      } catch (err) {
        console.error('Failed to update user profile from upload:', err);
      }

      return { uploadedBy: metadata?.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

