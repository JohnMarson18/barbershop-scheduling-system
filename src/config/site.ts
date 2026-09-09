export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "BarberFlow",
  description: "Sistema Moderno de Agendamento Online e Gestão para Barbearias",
  whatsappNumber: process.env.NEXT_PUBLIC_SHOP_WHATSAPP || "5511999999999",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  defaultAdminEmail: process.env.ADMIN_EMAIL || "admin@barberflow.com",
};
