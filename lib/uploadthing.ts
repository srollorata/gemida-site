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
      return { uploadedBy: metadata?.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

