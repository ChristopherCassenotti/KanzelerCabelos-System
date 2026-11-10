import { http } from "../api/http";
import type { ContactPhoto } from "../../types/contact";

export interface UploadContactPhotoInput {
  file: File;
  tipo?: string;
  compraId?: string;
}

export async function listContactPhotos(contactId: string) {
  const response = await http.get<ContactPhoto[]>(`/contatos/${contactId}/fotos`);
  return response.data;
}

export async function uploadContactPhoto(
  contactId: string,
  input: UploadContactPhotoInput,
  onProgress?: (progress: number) => void,
) {
  const form = new FormData();
  form.append("file", input.file);

  if (input.tipo) {
    form.append("tipo", input.tipo);
  }

  if (input.compraId) {
    form.append("compraId", input.compraId);
  }

  const response = await http.post<ContactPhoto>(`/contatos/${contactId}/fotos`, form, {
    onUploadProgress: (event) => {
      if (!onProgress) return;

      if (event.total && event.total > 0) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        return;
      }

      if (typeof event.progress === "number") {
        onProgress(Math.min(100, Math.round(event.progress * 100)));
      }
    },
  });

  return response.data;
}

export async function deleteContactPhoto(contactId: string, photoId: string) {
  await http.delete(`/contatos/${contactId}/fotos/${photoId}`);
}
