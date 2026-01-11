import { customers, montages, quotes, montageAttachments, montagePayments, erpProducts } from '@/lib/db/schema';
import { InferSelectModel } from 'drizzle-orm';

export type MontageWithRelations = InferSelectModel<typeof montages> & {
    attachments: InferSelectModel<typeof montageAttachments>[];
    payments: InferSelectModel<typeof montagePayments>[];
    quotes: InferSelectModel<typeof quotes>[];
};

export type CustomerWithRelations = Partial<InferSelectModel<typeof customers>> & {
    montages: MontageWithRelations[];
};

export type Product = InferSelectModel<typeof erpProducts>;

export type SampleProduct = Pick<Product, 'id' | 'name' | 'sku' | 'description' | 'imageUrl'>;
