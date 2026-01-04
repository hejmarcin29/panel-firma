import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/utils';

// Register fonts
Font.register({
    family: 'Open Sans',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 },
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 },
    ],
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Open Sans',
        fontSize: 10,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 10,
    },
    logo: {
        width: 120,
        height: 50,
        objectFit: 'contain',
    },
    companyInfo: {
        textAlign: 'right',
        fontSize: 8,
        color: '#666',
    },
    title: {
        fontSize: 18,
        fontWeight: 700,
        marginBottom: 5,
        color: '#000',
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 20,
        color: '#666',
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 700,
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 2,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    label: {
        width: 100,
        fontWeight: 600,
    },
    value: {
        flex: 1,
    },
    table: {
        marginTop: 10,
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#DDD',
        padding: 5,
        fontWeight: 700,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        padding: 5,
    },
    colName: { flex: 4 },
    colQty: { flex: 1, textAlign: 'right' },
    colPrice: { flex: 1.5, textAlign: 'right' },
    colVat: { flex: 1, textAlign: 'right' },
    colTotal: { flex: 1.5, textAlign: 'right' },
    
    totals: {
        marginTop: 10,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        paddingRight: 10,
    },
    totalValue: {
        width: 80,
        textAlign: 'right',
        fontWeight: 700,
    },
    terms: {
        marginTop: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    termsText: {
        fontSize: 9,
        lineHeight: 1.4,
        color: '#444',
    },
    signatureSection: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '40%',
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 5,
        alignItems: 'center',
    },
    signatureImage: {
        height: 40,
        marginBottom: 5,
    },
});

import type { QuoteItem } from '@/lib/db/schema';

interface QuotePdfProps {
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
}

// Simple HTML parser for React-PDF
const HtmlContent = ({ html }: { html: string }) => {
    if (!html) return null;

    // 1. Pre-process: Replace block tags with newlines
    let processed = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<h[1-6][^>]*>/gi, '\n\n') // Headers
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<ul[^>]*>/gi, '\n')
        .replace(/<\/ul>/gi, '\n')
        .replace(/<ol[^>]*>/gi, '\n')
        .replace(/<\/ol>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<tr[^>]*>/gi, '\n') // Simple table handling (rows as lines)
        .replace(/<\/td>/gi, ' | ')   // Cells separated by pipe
        .replace(/<\/th>/gi, ' | ');

    // Remove opening block tags
    processed = processed
        .replace(/<p[^>]*>/gi, '')
        .replace(/<div[^>]*>/gi, '')
        .replace(/<table[^>]*>/gi, '')
        .replace(/<\/table>/gi, '')
        .replace(/<tbody[^>]*>/gi, '')
        .replace(/<\/tbody>/gi, '')
        .replace(/<thead[^>]*>/gi, '')
        .replace(/<\/thead>/gi, '')
        .replace(/<td[^>]*>/gi, '')
        .replace(/<th[^>]*>/gi, '');

    // Split by newlines
    const paragraphs = processed.split('\n');

    return (
        <View>
            {paragraphs.map((paragraph, i) => {
                if (!paragraph.trim()) return <View key={i} style={{ height: 4 }} />;

                // Split by formatting tags
                const parts = paragraph.split(/(<\/?(?:b|strong|i|em|u)[^>]*>)/gi);
                
                let isBold = false;
                let isItalic = false;
                let isUnderline = false;

                return (
                    <Text key={i} style={{ marginBottom: 2, lineHeight: 1.4, fontSize: 9 }}>
                        {parts.map((part, j) => {
                            if (part.match(/<(?:b|strong)[^>]*>/i)) { isBold = true; return null; }
                            if (part.match(/<\/(?:b|strong)>/i)) { isBold = false; return null; }
                            if (part.match(/<(?:i|em)[^>]*>/i)) { isItalic = true; return null; }
                            if (part.match(/<\/(?:i|em)>/i)) { isItalic = false; return null; }
                            if (part.match(/<u[^>]*>/i)) { isUnderline = true; return null; }
                            if (part.match(/<\/u>/i)) { isUnderline = false; return null; }
                            
                            // Remove any other remaining tags
                            let text = part.replace(/<[^>]+>/g, '');

                            // Decode entities
                            text = text
                                .replace(/&nbsp;/g, ' ')
                                .replace(/&amp;/g, '&')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&quot;/g, '"')
                                .replace(/&oacute;/g, 'ó')
                                .replace(/&Oacute;/g, 'Ó')
                                .replace(/&lz;/g, 'ł')
                                .replace(/&Lz;/g, 'Ł')
                                .replace(/&zdot;/g, 'ż')
                                .replace(/&Zdot;/g, 'Ż')
                                .replace(/&acute;/g, 'ź')
                                .replace(/&Acute;/g, 'Ź')
                                .replace(/&cw;/g, 'ć')
                                .replace(/&Cw;/g, 'Ć')
                                .replace(/&ew;/g, 'ę')
                                .replace(/&Ew;/g, 'Ę')
                                .replace(/&sw;/g, 'ś')
                                .replace(/&Sw;/g, 'Ś')
                                .replace(/&aw;/g, 'ą')
                                .replace(/&Aw;/g, 'Ą')
                                .replace(/&nw;/g, 'ń')
                                .replace(/&Nw;/g, 'Ń');
                                
                            if (!text) return null;

                            return (
                                <Text key={j} style={{
                                    fontWeight: isBold ? 700 : 400,
                                    fontStyle: isItalic ? 'italic' : 'normal',
                                    textDecoration: isUnderline ? 'underline' : 'none',
                                }}>
                                    {text}
                                </Text>
                            );
                        })}
                    </Text>
                );
            })}
        </View>
    );
};

const replaceVariables = (text: string, quote: QuotePdfProps['quote'], companyInfo: QuotePdfProps['companyInfo']) => {
    if (!text) return '';
    let content = text;
    
    // Housing VAT clause logic (simplified for PDF)
    const housingVatClause = quote.montage.isHousingVat 
        ? 'Zamawiający oświadcza, że lokal mieszkalny, w którym wykonywana jest usługa, spełnia warunki art. 41 ust. 12 ustawy o VAT.' 
        : '';

    const replacements: Record<string, string> = {
        '{{klient_nazwa}}': quote.montage.clientName || '',
        '{{klient_adres}}': quote.montage.address || '',
        '{{klient_email}}': quote.montage.contactEmail || '',
        '{{klient_telefon}}': quote.montage.contactPhone || '',
        '{{numer_wyceny}}': quote.number || 'DRAFT',
        '{{data_wyceny}}': new Date(quote.createdAt).toLocaleDateString('pl-PL'),
        '{{kwota_netto}}': formatCurrency(quote.totalNet),
        '{{kwota_brutto}}': formatCurrency(quote.totalGross),
        '{{adres_montazu}}': quote.montage.address || '', // Fallback if installationAddress is missing in props
        '{{data_rozpoczecia}}': 'Do ustalenia', // Not passed in props currently
        '{{termin_zakonczenia}}': 'Do ustalenia',
        '{{oswiadczenie_vat}}': housingVatClause,
        '{{logo_firmy}}': '', // Logo is in header
        '{{tabela_produktow}}': '', // Table is rendered natively at the top
        '{{uwagi_wyceny}}': '', // Not passed in props
        '{{firma_nazwa}}': companyInfo.name,
        '{{firma_adres}}': companyInfo.address,
        '{{firma_nip}}': companyInfo.nip,
        '{{firma_bank}}': '', // Not passed in props
        '{{firma_konto}}': '', // Not passed in props
    };

    Object.entries(replacements).forEach(([key, value]) => {
        content = content.replace(new RegExp(key, 'g'), value);
    });

    return content;
};

export const QuotePdf = ({ quote, companyInfo }: QuotePdfProps) => {
    const processedTerms = quote.termsContent 
        ? replaceVariables(quote.termsContent, quote, companyInfo) 
        : null;

    return (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    {companyInfo.logoUrl && <Image src={companyInfo.logoUrl} style={styles.logo} />}
                </View>
                <View style={styles.companyInfo}>
                    <Text style={{ fontWeight: 700 }}>{companyInfo.name}</Text>
                    <Text>{companyInfo.address}</Text>
                    <Text>NIP: {companyInfo.nip}</Text>
                </View>
            </View>

            {/* Title */}
            <View style={styles.section}>
                <Text style={styles.title}>OFERTA / UMOWA</Text>
                <Text style={styles.subtitle}>Nr: {quote.number || 'DRAFT'}</Text>
                <Text>Data wystawienia: {new Date(quote.createdAt).toLocaleDateString('pl-PL')}</Text>
            </View>

            {/* Customer Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nabywca</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nazwa:</Text>
                    <Text style={styles.value}>{quote.montage.clientName}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Adres:</Text>
                    <Text style={styles.value}>{quote.montage.address}</Text>
                </View>
                {quote.montage.contactEmail && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{quote.montage.contactEmail}</Text>
                    </View>
                )}
                {quote.montage.contactPhone && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Telefon:</Text>
                        <Text style={styles.value}>{quote.montage.contactPhone}</Text>
                    </View>
                )}
            </View>

            {/* Items Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colName}>Nazwa</Text>
                    <Text style={styles.colQty}>Ilość</Text>
                    <Text style={styles.colPrice}>Cena netto</Text>
                    <Text style={styles.colVat}>VAT</Text>
                    <Text style={styles.colTotal}>Wartość</Text>
                </View>
                {quote.items.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                        <Text style={styles.colName}>{item.name}</Text>
                        <Text style={styles.colQty}>{item.quantity} {item.unit}</Text>
                        <Text style={styles.colPrice}>{formatCurrency(item.priceNet)}</Text>
                        <Text style={styles.colVat}>{item.vatRate * 100}%</Text>
                        <Text style={styles.colTotal}>{formatCurrency(item.totalGross)}</Text>
                    </View>
                ))}
            </View>

            {/* Totals */}
            <View style={styles.totals}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Suma Netto:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(quote.totalNet)}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Suma Brutto:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(quote.totalGross)}</Text>
                </View>
            </View>

            {/* Terms */}
            {processedTerms && (
                <View style={styles.terms}>
                    <Text style={styles.sectionTitle}>Warunki Współpracy</Text>
                    <HtmlContent html={processedTerms} />
                </View>
            )}

            {/* Signatures */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                    <Text>Wykonawca</Text>
                </View>
                <View style={styles.signatureBox}>
                    {quote.signatureData ? (
                        // eslint-disable-next-line jsx-a11y/alt-text
                        <Image src={quote.signatureData} style={styles.signatureImage} />
                    ) : null}
                    <Text>Zamawiający</Text>
                    {quote.signedAt && (
                        <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
                            Podpisano: {new Date(quote.signedAt).toLocaleDateString('pl-PL')}
                        </Text>
                    )}
                </View>
            </View>
        </Page>
    </Document>
    );
};
