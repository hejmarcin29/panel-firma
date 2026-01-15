
import { db } from '@/lib/db';


async function listProducts() {
    const products = await db.query.erpProducts.findMany({
        // Filter out skirting boards (listwy) based on name analysis
        // Usually accessories don't have 'LVT', 'SPC', 'Jodełka' in names in the same way, or contain 'Listwa'
        // Let's filter in JS to be precise
        columns: {
            id: true,
            name: true,
            collectionId: true,
            floorPatternId: true, // To detect herringbone/pattern context
        },
        with: {
            collection: {
                columns: {
                    name: true,
                }
            }
        }
    });

    // Simple heuristic to filter only FLOORS (Panele)
    const floorProducts = products.filter(p => {
        const lowerName = p.name.toLowerCase();
        return !lowerName.includes('listwa') && 
               !lowerName.includes('podkład') && 
               !lowerName.includes('profil') &&
               !lowerName.includes('próbka') && 
               (lowerName.includes('spc') || lowerName.includes('lvt') || lowerName.includes('jodełka') || lowerName.includes('panele') || lowerName.includes('podłogi'));
    });

     const proposals = floorProducts.map(p => {
        let cleanName = p.name
            .replace(/— SPC na klik \d+(?:,\d+)? ?mm/gi, '') // Remove tech specs
            .replace(/— LVT na klej \d+(?:,\d+)? ?mm/gi, '')
            .replace(/— LVT samoprzylepne \d+(?:,\d+)? ?mm/gi, '')
            .replace(/— na klik \d+(?:,\d+)? ?mm/gi, '')
            .replace(/Egibi Floors/gi, '')
            .replace(/Podłogi z Natury/gi, '')
            .replace(/—/g, '') // Remove dashes
            .trim();
        
        // Custom shorteners
        if (cleanName.includes('Jodełka')) {
             // Keep "Name Jodełka"
             const parts = cleanName.split('Jodełka');
             cleanName = parts[0].trim() + ' Jodełka';
        }

        // Clean up double spaces
        cleanName = cleanName.replace(/\s+/g, ' ').trim();

        return {
            original: p.name,
            proposal: cleanName
        };
    });

    console.log(JSON.stringify(proposals, null, 2));
    process.exit(0);
}

listProducts().catch(console.error);
