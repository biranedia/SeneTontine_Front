// Contact du support SèneTontine (WhatsApp, format international sans +).
export const SUPPORT_WHATSAPP = '221773369395';
export const SUPPORT_DISPLAY = '+221 77 336 93 95';
export const SUPPORT_EMAIL = 'diawbirane933@gmail.com';

// Lien WhatsApp avec message pré-rempli. Sans numéro : WhatsApp laisse choisir le contact.
export function whatsappUrl(text: string, phone?: string) {
  return `https://wa.me/${phone ?? ''}?text=${encodeURIComponent(text)}`;
}
