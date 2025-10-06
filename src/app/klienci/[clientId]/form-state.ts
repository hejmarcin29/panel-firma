export type UploadClientAttachmentsState = {
  status: "idle" | "success" | "error";
  message?: string;
  uploaded?: number;
};

export const INITIAL_UPLOAD_CLIENT_ATTACHMENTS_STATE: UploadClientAttachmentsState = {
  status: "idle",
};
