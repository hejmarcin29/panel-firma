'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileText as FileTextIcon } from 'lucide-react';
import { QuotePdf } from './quote-pdf';
import type { QuoteItem } from '@/lib/db/schema';

interface QuotePdfWrapperProps {
    quote: {
        number: string | null;
        createdAt: string | Date;
        montage: {
            clientName: string;
            address: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            isHousingVat?: boolean | null;
        };
        items: QuoteItem[];
        totalNet: number;
        totalGross: number;
        termsContent?: string | null;
        signatureData?: string | null;
        signedAt?: string | Date | null;
    };
    companyInfo: {
        name: string;
        address: string;
        nip: string;
        logoUrl?: string;
    };
    render?: (loading: boolean) => React.ReactNode;
}

export default function QuotePdfWrapper({ quote, companyInfo, render }: QuotePdfWrapperProps) {
    return (
        <PDFDownloadLink
            document={<QuotePdf quote={quote} companyInfo={companyInfo} />}
            fileName={`Oferta_${quote.number || 'draft'}.pdf`}
        >
            {({ loading }) => (
                render ? render(loading) : (
                    <Button variant="outline" disabled={loading}>
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        {loading ? 'Generowanie...' : 'Pobierz PDF'}
                    </Button>
                )
            )}
        </PDFDownloadLink>
    );
}
