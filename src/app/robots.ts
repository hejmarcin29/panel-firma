import { MetadataRoute } from 'next';
import { getShopConfig } from '@/app/dashboard/settings/shop/actions';

export default async function robots(): Promise<MetadataRoute.Robots> {
  let config;
  
  try {
    config = await getShopConfig();
  } catch (error) {
    console.warn('Could not fetch shop config for robots.txt, using defaults:', error);
    // Fallback config
    config = { noIndex: false };
  }
  
  return {
    rules: {
      userAgent: '*',
      // Jeśli włączone noIndex w panelu, to blokujemy wszystko
      allow: config.noIndex ? undefined : '/',
      disallow: config.noIndex ? '/' : '/dashboard', // Zawsze chronimy dashboard (choć wymagane logowanie, to dobra praktyka)
    },
    sitemap: 'https://primepodloga.pl/sitemap.xml',
  }
}
