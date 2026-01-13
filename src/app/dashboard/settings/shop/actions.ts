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
            samplePrice: 2000, // 20.00 PLN (grosze)
            sampleShippingCost: 1500, // 15.00 PLN (grosze)
            proformaBankName: '',
            proformaBankAccount: '',
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
