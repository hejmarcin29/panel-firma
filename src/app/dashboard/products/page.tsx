import { getProducts, getProductsFromDb, getCategories, getAttributes, getAttributeTerms, WooCommerceAttributeTerm } from './actions';
import { ProductsListClient } from './products-list-client';
import { requireUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    await requireUser();
    
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
    
    const categoryIds = typeof resolvedSearchParams.categories === 'string' ? resolvedSearchParams.categories : undefined;
    const brandIds = typeof resolvedSearchParams.brands === 'string' ? resolvedSearchParams.brands : undefined;
    
    // getProducts currently only supports single category/brand.
    // I'll take the first one if multiple are selected for now, or update getProducts to support array if possible (not easy with standard WC API).
    const categoryId = categoryIds ? parseInt(categoryIds.split(',')[0]) : undefined;
    const brandTermId = brandIds ? parseInt(brandIds.split(',')[0]) : undefined;

    const scope = typeof resolvedSearchParams.scope === 'string' ? resolvedSearchParams.scope as 'public' | 'private' | 'all' : 'public';
    const search = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined;
    const sort = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : undefined;
    const perPage = 20;

    const [productsData, categories, attributes] = await Promise.all([
        getProductsFromDb({
            page, 
            perPage, 
            categoryId, 
            brandTermId,
            scope,
            search,
            sort
        }),
        getCategories(),
        getAttributes()
    ]);

    // Find "Brand" or "Marka" attribute
    const brandAttribute = attributes.find(attr => 
        attr.name.toLowerCase() === 'marka' || 
        attr.name.toLowerCase() === 'brand' || 
        attr.slug.toLowerCase().includes('brand') ||
        attr.slug.toLowerCase().includes('marka')
    );

    let brandTerms: WooCommerceAttributeTerm[] = [];
    if (brandAttribute) {
        brandTerms = await getAttributeTerms(brandAttribute.id);
    }

    return (
        <ProductsListClient 
            initialProducts={productsData.products} 
            initialTotal={productsData.total} 
            initialTotalPages={productsData.totalPages}
            currentPage={page}
            categories={categories}
            brandTerms={brandTerms}
        />
    );
}
