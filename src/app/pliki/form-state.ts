export type CreateFolderState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const INITIAL_CREATE_FOLDER_STATE: CreateFolderState = {
  status: "idle",
};
