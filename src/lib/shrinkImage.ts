// Réduit une photo avant envoi (photo de profil) : carré centré 400 px, JPEG ~80 %.
// Sur le web, le sélecteur d'images ignore « quality » et « allowsEditing » : une photo de
// téléphone (plusieurs Mo) dépassait la limite du serveur et l'envoi échouait.
import { Platform } from 'react-native';

export async function shrinkToBase64(uri: string, fallbackBase64?: string | null, size = 400): Promise<string | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return fallbackBase64 ?? null;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = uri;
  });
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return fallbackBase64 ?? null;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1] ?? null;
}
