import { storage } from './firebase';
import { ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';

export async function uploadDataUrlToStorage(dataUrl, folder = 'public', filename = null) {
  if (!filename) {
    filename = `image_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
  }
  const storageRef = ref(storage, `${folder}/${filename}`);
  await uploadString(storageRef, dataUrl, 'data_url');
  return await getDownloadURL(storageRef);
}

export async function uploadFileToStorage(file, folder = 'public', filename = null) {
  if (!filename) {
    filename = `file_${Date.now()}_${file.name}`;
  }
  const storageRef = ref(storage, `${folder}/${filename}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
