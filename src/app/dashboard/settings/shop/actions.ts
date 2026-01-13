'use server';

import { db } from '@/lib/db';
import { globalSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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
};

export type TpayConfig = {
    clientId: string;
    clientSecret: string;
    isSandbox: boolean;
};

export async function getShopConfig(): Promise<ShopConfig> {
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
            heroHeadline: 'Twoja wymarzona podłoga',
            heroSubheadline: 'Największy wybór podłóg drewnianych i paneli winylowych z profesjonalnym montażem.',
            noIndex: false,
        };
    }

    return setting.value as ShopConfig;
}

export async function updateShopConfig(data: ShopConfig) {
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

    revalidatePath('/dashboard/settings/shop');
    revalidatePath('/sklep');
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
