import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

// Basic file router: images and PDFs up to 8MB; TODO: add auth and RBAC (admin/installer)
export const fileRouter = {
  orderAttachments: f({
    image: { maxFileSize: "8MB" },
    "application/pdf": { maxFileSize: "8MB" },
  }).onUploadComplete(async ({ file }) => {
    // TODO: persist attachment metadata in DB (order_id foreign key)
    console.log("Upload complete", file.name);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;
