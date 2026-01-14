import { MetadataRoute } from 'next';
import { getShopConfig } from '@/app/dashboard/settings/shop/actions';

export default async function robots(): Promise<MetadataRoute.Robots> {
  let config;
  
  try {
    config = await getShopConfig();
  } catch (error) {
    if (process.env.NODE_ENV === 'production' && (error as { code?: string })?.code === 'ECONNREFUSED') {
      // Ignore DB connection errors during build
      console.log('Skipping robots.txt config fetch (DB not available)');
    } else {
      console.warn('Could not fetch shop config for robots.txt, using defaults.');
    }
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
