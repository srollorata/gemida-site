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
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete");
      console.log("file url", file.url);

      // Optional: update user's profile image automatically when requested.
      // If the client includes a flag `updateProfile` in the request metadata, update the user's profileImage.
      try {
        if (metadata?.userId && metadata?.updateProfile) {
          // Import prisma lazily to avoid circular/edge issues
          const { prisma } = await import('@/lib/prisma');
          await prisma.user.update({
            where: { id: metadata.userId },
            data: { profileImage: file.url },
          });
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
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete");
      console.log("file url", file.url);

      // Optional: update user's profile image automatically when requested.
      // If the client includes a flag `updateProfile` in the request metadata, update the user's profileImage.
      try {
        if (metadata?.userId && metadata?.updateProfile) {
          // Import prisma lazily to avoid circular/edge issues
          const { prisma } = await import('@/lib/prisma');
          await prisma.user.update({
            where: { id: metadata.userId },
            data: { profileImage: file.url },
          });
        }
      } catch (err) {
        console.error('Failed to update user profile from upload:', err);
      }

      return { uploadedBy: metadata?.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

