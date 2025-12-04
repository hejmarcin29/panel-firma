export type FilterType = 'checkbox' | 'range' | 'radio';

export interface FilterConfig {
  id: string;           // e.g. 'pa_warstwa-uzytkowa-mm' (slug from API)
  label: string;        // e.g. 'Warstwa użytkowa'
  type: FilterType;
  options?: { label: string; value: string }[]; // Options fetched dynamically or static
}

export const FILTERS_CONFIG: FilterConfig[] = [
  {
    id: 'categories',
    label: 'Kategoria',
    type: 'checkbox',
  },
  {
    id: 'brands',
    label: 'Marka',
    type: 'checkbox',
  },
  {
    id: 'price',
    label: 'Cena',
    type: 'range',
  },
  {
    id: 'pa_warstwa-uzytkowa-mm',
    label: 'Warstwa użytkowa',
    type: 'checkbox',
  },
  {
    id: 'pa_grubosc',
    label: 'Grubość',
    type: 'checkbox',
  },
  {
    id: 'pa_wzor',
    label: 'Wzór',
    type: 'checkbox',
  },
  {
    id: 'pa_technologia',
    label: 'Montaż',
    type: 'checkbox',
  },
];
