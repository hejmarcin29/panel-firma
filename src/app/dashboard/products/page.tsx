import { getProductsFromDb, getCategories, getAttributes, getAttributeTerms, WooCommerceAttributeTerm } from './actions';
import { ProductsListClient } from './products-list-client';
import { requireUser } from '@/lib/auth/session';
import { FILTERS_CONFIG } from '@/lib/filter-config';

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

    const [categories, attributes] = await Promise.all([
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
    let brandName: string | undefined;

    if (brandAttribute) {
        brandTerms = await getAttributeTerms(brandAttribute.id);
        if (brandTermId) {
            const term = brandTerms.find(t => t.id === brandTermId);
            if (term) {
                brandName = term.name;
            }
        }
    }

    // Fetch other attribute terms
    const otherAttributeTerms: Record<string, WooCommerceAttributeTerm[]> = {};
    const attributeFilters: Record<string, string> = {};

    const filterPromises = FILTERS_CONFIG
        .filter(f => f.id !== 'categories' && f.id !== 'brands' && f.id !== 'price')
        .map(async (filter) => {
            const attr = attributes.find(a => a.slug === filter.id);
            if (attr) {
                const terms = await getAttributeTerms(attr.id);
                otherAttributeTerms[filter.id] = terms;
                
                // Check if this filter is active in searchParams
                const paramValue = resolvedSearchParams[filter.id];
                if (typeof paramValue === 'string') {
                    const termId = parseInt(paramValue.split(',')[0]);
                    const term = terms.find(t => t.id === termId);
                    if (term) {
                        attributeFilters[filter.id] = term.name;
                    }
                }
            }
        });

    await Promise.all(filterPromises);

    const productsData = await getProductsFromDb({
        page, 
        perPage, 
        categoryId, 
        brandTermId,
        brandName,
        attributeFilters,
        scope,
        search,
        sort
    });

    return (
        <ProductsListClient 
            initialProducts={productsData.products} 
            initialTotal={productsData.total} 
            initialTotalPages={productsData.totalPages}
            currentPage={page}
            categories={categories}
            brandTerms={brandTerms}
            otherAttributeTerms={otherAttributeTerms}
        />
    );
}
