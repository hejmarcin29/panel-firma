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

export const QuotePdf = ({ quote, companyInfo }: QuotePdfProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    {companyInfo.logoUrl && <Image src={companyInfo.logoUrl} style={styles.logo} alt="Logo firmy" />}
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
            {quote.termsContent && (
                <View style={styles.terms}>
                    <Text style={styles.sectionTitle}>Warunki Współpracy</Text>
                    <Text style={styles.termsText}>{quote.termsContent}</Text>
                </View>
            )}

            {/* Signatures */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                    <Text>Wykonawca</Text>
                </View>
                <View style={styles.signatureBox}>
                    {quote.signatureData ? (
                        <Image src={quote.signatureData} style={styles.signatureImage} alt="Podpis klienta" />
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
