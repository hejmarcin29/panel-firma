import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Magazyn',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
