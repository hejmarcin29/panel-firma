
export const PRICING_RULES = [
    {
        id: 'glue_herringbone',
        conditions: {
            mountingMethod: 'glue',
            floorPattern: 'herringbone'
        },
        rates: {
            labor: 65, // zł/m2
            chemistry: 25 // zł/m2 (klej + grunt)
        }
    },
    {
        id: 'click_herringbone',
        conditions: {
            mountingMethod: 'click',
            floorPattern: 'herringbone'
        },
        rates: {
            labor: 45,
            chemistry: 5 // zł/m2 (folia)
        }
    },
    {
        id: 'glue_plank',
        conditions: {
            mountingMethod: 'glue',
            floorPattern: 'plank' // deska/klasyczny
        },
        rates: {
            labor: 55,
            chemistry: 25
        }
    },
    {
        id: 'click_plank',
        conditions: {
            mountingMethod: 'click',
            floorPattern: 'plank'
        },
        rates: {
            labor: 35,
            chemistry: 5
        }
    }
];

export const FALLBACK_RATE = {
    labor: 40,
    chemistry: 10
};

export const VAT_RATES = {
    standard: 0.23,
    housing: 0.08
};
