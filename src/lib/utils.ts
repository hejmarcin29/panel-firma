import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(amount);
}

export function generatePortalToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function generateId(prefix?: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 21; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}_${token}` : token;
}

export function slugify(text: string): string {
  const map: { [key: string]: string } = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
  };

  const folded = text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, match => map[match]);

  return folded
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Zamień spacje na myślniki
    .replace(/[^\w\-]+/g, '') // Usuń wszystko co nie jest literą, cyfrą lub myślnikiem
    .replace(/\-\-+/g, '-')   // Zredukuj powtórzone myślniki
    .replace(/^-+/, '')       // Usuń myślniki z początku
    .replace(/-+$/, '');      // Usuń myślniki z końca
}
