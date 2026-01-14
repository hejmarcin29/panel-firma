'use server';

import { db } from '@/lib/db';
import { globalSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';

export type ShopConfig = {
    isShopEnabled: boolean;
    samplePrice: number;
    sampleShippingCost: number;
    proformaBankName: string;
    proformaBankAccount: string;
    welcomeEmailTemplate?: string;
    heroImage?: string;
    heroHeadline?: string;
    heroSubheadline?: string;
    measurementProductId?: string; // ID produktu "Usługa Pomiarowa"

    // SEO & Firma
    organizationLogo?: string;
    contactPhone?: string;
    contactEmail?: string;
    socialFacebook?: string;
    socialInstagram?: string;
    
    // Integracje
    googleSearchConsoleId?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    
    // Kontrola
    noIndex?: boolean;

    // Header
    headerLogo?: string;
    headerShowSearch?: boolean;
    headerShowUser?: boolean;
    showGrossPrices?: boolean; // Pokaż ceny brutto
    vatRate?: number; // Stawka VAT (np. 23)

    // Wygląd i Kolorystyka
    primaryColor?: string; // Główny kolor (np. #b02417)
    // secondaryColor?: string; // Opcjonalnie w przyszłości

    // Kalkulator Ofertowy (Marketing)
    calculatorRates?: {
        glue_herringbone: { labor: number; chemistry: number };
        click_herringbone: { labor: number; chemistry: number };
        glue_plank: { labor: number; chemistry: number };
        click_plank: { labor: number; chemistry: number };
    };
};

export type TpayConfig = {
    clientId: string;
    clientSecret: string;
    isSandbox: boolean;
};

export const getShopConfig = unstable_cache(
    async (): Promise<ShopConfig> => {
        const setting = await db.query.globalSettings.findFirst({
            where: eq(globalSettings.key, 'shop_config'),
        });

        if (!setting) {
            return {
                isShopEnabled: false,
                samplePrice: 2000,
                sampleShippingCost: 1500,
                proformaBankName: '',
                proformaBankAccount: '',
                headerShowSearch: true,
                headerShowUser: true,
                headerLogo: '',
                showGrossPrices: false,
                vatRate: 23,
                heroHeadline: 'Twoja wymarzona podłoga',
                heroSubheadline: 'Największy wybór podłóg drewnianych i paneli winylowych z profesjonalnym montażem.',
                noIndex: false,
                calculatorRates: {
                    glue_herringbone: { labor: 65, chemistry: 25 },
                    click_herringbone: { labor: 45, chemistry: 5 },
                    glue_plank: { labor: 55, chemistry: 25 },
                    click_plank: { labor: 35, chemistry: 5 },
                }
            };
        }

        const config = setting.value as ShopConfig;
        if (!config.calculatorRates) {
            config.calculatorRates = {
                    glue_herringbone: { labor: 65, chemistry: 25 },
                    click_herringbone: { labor: 45, chemistry: 5 },
                    glue_plank: { labor: 55, chemistry: 25 },
                    click_plank: { labor: 35, chemistry: 5 },
            };
        }

        return config;
    },
    ['shop_config_global'],
    { tags: ['shop_config'] }
);

import { processAndUploadImage } from '@/lib/r2/upload';


export async function uploadShopImage(formData: FormData) {
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'system/branding';
    
    if (!file) throw new Error('No file uploaded');

    return await processAndUploadImage({
        file,
        folderPath: folder,
    });
}

export async function updateShopConfig(
    data: ShopConfig, 
    files?: { 
        logoFile?: File; 
        headerLogoFile?: File; 
        heroImageFile?: File 
    }
) {
    // 1. Przetworzenie plików (jeśli zostały przesłane)
    const currentConfig = await getShopConfig();

    if (files?.logoFile) {
        data.organizationLogo = await processAndUploadImage({
            file: files.logoFile,
            folderPath: 'system/branding',
            existingUrl: currentConfig.organizationLogo
        });
    }

    if (files?.headerLogoFile) {
        data.headerLogo = await processAndUploadImage({
            file: files.headerLogoFile,
            folderPath: 'system/branding',
            existingUrl: currentConfig.headerLogo
        });
    }

    if (files?.heroImageFile) {
        data.heroImage = await processAndUploadImage({
            file: files.heroImageFile,
            folderPath: 'system/branding', // lub 'system/banners'
            existingUrl: currentConfig.heroImage
        });
    }

    await db
        .insert(globalSettings)
        .values({
            key: 'shop_config',
            value: data,
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: globalSettings.key,
            set: {
                value: data,
                updatedAt: new Date(),
            },
        });

    revalidateTag('shop_config');
    revalidatePath('/', 'layout'); // Odśwież cały sklep (layout, home, produkty)
    revalidatePath('/dashboard/settings/shop');
}

export async function getTpayConfig(): Promise<TpayConfig> {
    const setting = await db.query.globalSettings.findFirst({
        where: eq(globalSettings.key, 'tpay_config'),
    });

    if (!setting) {
        return {
            clientId: '',
            clientSecret: '',
            isSandbox: true,
        };
    }

    return setting.value as TpayConfig;
}

export async function updateTpayConfig(data: TpayConfig) {
    await db
        .insert(globalSettings)
        .values({
            key: 'tpay_config',
            value: data,
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: globalSettings.key,
            set: {
                value: data,
                updatedAt: new Date(),
            },
        });

    revalidatePath('/dashboard/settings/integrations');
    revalidatePath('/dashboard/settings/shop');
}
