export const adminWhatsappNumber = "6281234567890";

export function adminWhatsappLink(message: string) {
  return `https://wa.me/${adminWhatsappNumber}?text=${encodeURIComponent(message)}`;
}

