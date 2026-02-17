import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const f = createUploadthing();

async function getUserFromRequest(req: Request) {
  // Try Authorization header first
  const authHeader = req.headers.get('authorization');
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Fallback to Cookie header
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('token='));
    if (match) {
      token = match.substring('token='.length);
    }
  }

  if (!token) return null;

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; role?: string };
    if (!decoded?.userId) return null;

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return null;

    return { id: user.id, role: user.role };
  } catch (err) {
    return null;
  }
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await getUserFromRequest(req as any as Request);

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError('Unauthorized');

      // Return server-verified metadata; do NOT trust client-sent userId
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }: { metadata: { userId: string; updateProfile?: boolean }, file: { ufsUrl: string } }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log('Upload complete for userId:', metadata.userId);
      console.log('file url', file.ufsUrl);

      try {
        if (metadata?.userId && metadata?.updateProfile) {
          // Basic sanitization: ensure URL is https and not excessively long
          if (typeof file.ufsUrl === 'string' && file.ufsUrl.startsWith('https://') && file.ufsUrl.length < 2000) {
            await prisma.user.update({
              where: { id: metadata.userId },
              data: { profileImage: file.ufsUrl },
            });
          } else {
            console.warn('Uploaded file ufsUrl failed basic sanitization, skipping profile update');
          }
        }
      } catch (err) {
        console.error('Failed to update user profile from upload:', err);
      }

      // Return metadata to client
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
