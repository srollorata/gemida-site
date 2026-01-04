import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";
import { getAuthUser } from "@/lib/api-helpers";
import { NextRequest } from "next/server";
import { UploadThingError } from "uploadthing/server";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  async onRequest(req: NextRequest) {
    // Require authentication for uploads
    const auth = getAuthUser(req);
    if (!auth) {
      throw new UploadThingError("Unauthorized - Please log in to upload files");
    }

    // Allow optional query flag `updateProfile=true` to instruct onUploadComplete to update the user's profileImage
    const updateProfileParam = req.nextUrl?.searchParams?.get('updateProfile');
    const updateProfile = updateProfileParam === 'true' || updateProfileParam === '1';

    // Return metadata that will be available in onUploadComplete
    return { userId: auth.userId, updateProfile };
  },
});

