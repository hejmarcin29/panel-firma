'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Image as ImageIcon, Ruler, Calculator, Check, Mail, AlertCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { signQuote, sendQuoteEmailToCustomer, saveSignedContract } from '../actions';
import { useState } from 'react';
import { SignaturePad } from '@/components/ui/signature-pad';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { MontageTimeline } from './montage-timeline';
import { DataRequestCard } from './data-request-card';
import { InstallationDateCard } from './installation-date-card';
import type { QuoteItem } from '@/lib/db/schema';
import dynamic from 'next/dynamic';
import { pdf } from '@react-pdf/renderer';
import { QuotePdf } from '@/app/dashboard/crm/oferty/_components/quote-pdf';

const QuotePdfWrapper = dynamic(() => import('@/app/dashboard/crm/oferty/_components/quote-pdf-wrapper'), {
  ssr: false,
  loading: () => <Button variant="outline" size="sm" disabled>Ładowanie PDF...</Button>,
});

interface MontageAttachment {
    id: string;
    url: string;
    title: string | null;
}

interface Payment {
    id: string;
    type: 'advance' | 'final' | 'other';
    name: string;
    amount: string;
    status: 'pending' | 'paid';
    invoiceNumber: string;
    proformaUrl: string | null;
    invoiceUrl: string | null;
    dueDate: Date | null;
    paidAt: Date | null;
    createdAt: Date;
}

interface Quote {
    id: string;
    number: string | null;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    totalGross: number;
    createdAt: Date;
    validUntil: Date | null;
    termsContent: string | null;
    signedAt: Date | null;
    signatureData: string | null;
    items: QuoteItem[];
}

interface Montage {
    id: string;
    displayId: string | null;
    clientName: string;
    status: string;
    createdAt: Date;
    forecastedInstallationDate: Date | null;
    scheduledInstallationAt: Date | null;
    installationDateConfirmed: boolean | null;
    attachments: MontageAttachment[];
    payments: Payment[];
    quotes: Quote[];
    floorArea: number | null;
    estimatedFloorArea?: number | null;
    floorDetails: string | null;
    measurementDetails: string | null;
    installationCity: string | null;
    measurementDate: Date | null;
    contactEmail: string | null;
    contactPhone: string | null;
    address: string | null;
    installationAddress: string | null;
    installationPostalCode: string | null;
    additionalInfo: string | null;
    
    // Billing
    isHousingVat: boolean | null;
    isCompany: boolean | null;
    companyName: string | null;
    nip: string | null;
    billingAddress: string | null;
    billingCity: string | null;
    billingPostalCode: string | null;
}

interface Customer {
    name: string | null;
    montages: Montage[];
}

interface CustomerPortalProps {
    customer: Customer;
    token: string;
    bankAccount?: string;
    companyInfo: {
        name: string;
        address: string;
        nip: string;
        logoUrl?: string;
    };
}

export function CustomerPortal({ customer, token, bankAccount, companyInfo }: CustomerPortalProps) {
    const activeMontage = customer.montages[0]; // For now, just take the latest one
    const [contractDialogOpen, setContractDialogOpen] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailConfirmOpen, setEmailConfirmOpen] = useState(false);
    const [pendingSignature, setPendingSignature] = useState<string | null>(null);
    const [isSavingContract, setIsSavingContract] = useState(false);

    const isImage = (url: string) => {
        return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
    };

    const images = activeMontage?.attachments.filter(att => isImage(att.url)) || [];
    const documents = activeMontage?.attachments.filter(att => !isImage(att.url)) || [];
    const activeQuote = activeMontage?.quotes.find(q => q.status === 'sent' || q.status === 'accepted');

    const replaceVariables = (content: string) => {
        if (!content) return '';
        let text = content;

        const itemsTableHtml = activeQuote ? `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
            <thead>
                <tr style="background-color: #f9fafb;">
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Nazwa</th>
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Ilość</th>
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Cena Netto</th>
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Wartość Brutto</th>
                </tr>
            </thead>
            <tbody>
                ${activeQuote.items.map(item => `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #e5e7eb;">${item.name}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${item.quantity} ${item.unit}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.priceNet)}</td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.totalGross)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '';
        
        const replacements: Record<string, string> = {
            '{{klient_nazwa}}': activeMontage?.clientName || '',
            '{{klient_adres}}': activeMontage?.address || '',
            '{{klient_email}}': activeMontage?.contactEmail || '',
            '{{klient_telefon}}': activeMontage?.contactPhone || '',
            '{{numer_wyceny}}': activeQuote?.number || '',
            '{{data_wyceny}}': activeQuote ? new Date(activeQuote.createdAt).toLocaleDateString('pl-PL') : '',
            '{{kwota_netto}}': activeQuote ? formatCurrency(activeQuote.items.reduce((acc, item) => acc + item.priceNet * item.quantity, 0)) : '',
            '{{kwota_brutto}}': activeQuote ? formatCurrency(activeQuote.totalGross) : '',
            '{{adres_montazu}}': activeMontage?.installationAddress || activeMontage?.address || activeMontage?.installationCity || '',
            '{{data_rozpoczecia}}': activeMontage?.scheduledInstallationAt ? new Date(activeMontage.scheduledInstallationAt).toLocaleDateString('pl-PL') : 'Do ustalenia',
            '{{termin_zakonczenia}}': 'Do ustalenia',
            '{{oswiadczenie_vat}}': '', // Removed as per request - VAT 8% is handled by installer in protocol
            '{{firma_nazwa}}': companyInfo.name,
            '{{firma_adres}}': companyInfo.address,
            '{{firma_nip}}': companyInfo.nip,
            '{{logo_firmy}}': '', 
            '{{tabela_produktow}}': itemsTableHtml,
            '{{podpis_wykonawcy}}': '', // Removed as per request
            '{{firma_bank}}': bankAccount || '',
            '{{firma_konto}}': '', // Duplicate of bankAccount usually
        };

        Object.entries(replacements).forEach(([key, value]) => {
            text = text.replace(new RegExp(key, 'g'), value);
        });
        
        return text;
    };

    const handleSignQuote = (signatureData: string) => {
        if (!activeQuote) {
            toast.error('Błąd: Nie znaleziono aktywnej oferty.');
            return;
        }
        setPendingSignature(signatureData);
        setEmailConfirmOpen(true);
    };

    const finalizeSignature = async (sendEmail: boolean) => {
        if (!activeQuote || !pendingSignature || !activeMontage) return;
        
        setIsSavingContract(true);
        setEmailConfirmOpen(false);
        // Keep contract dialog open while saving to show progress if we wanted, 
        // but for now let's close it or keep it open with a loading state.
        // We'll close it after success.

        try {
            const quoteForPdf = {
                ...activeQuote,
                signatureData: pendingSignature,
                signedAt: new Date(),
                montage: {
                    clientName: activeMontage.clientName,
                    address: activeMontage.installationAddress || activeMontage.address || activeMontage.installationCity || '',
                    contactEmail: activeMontage.contactEmail,
                    contactPhone: activeMontage.contactPhone,
                    isHousingVat: activeMontage.isHousingVat,
                },
                totalNet: activeQuote.items.reduce((acc, item) => acc + item.priceNet * item.quantity, 0),
            };

            const blob = await pdf(
                <QuotePdf quote={quoteForPdf} companyInfo={companyInfo} />
            ).toBlob();

            const file = new File([blob], `umowa_${activeQuote.number || 'podpisana'}.pdf`, { type: 'application/pdf' });
            const formData = new FormData();
            formData.append('file', file);
            formData.append('montageId', activeMontage.id);
            formData.append('sendEmail', String(sendEmail));

            // 1. Save contract (upload + email)
            await saveSignedContract(token, formData);

            // 2. Sign quote (update status)
            await signQuote(activeQuote.id, pendingSignature, token);

            toast.success('Oferta została zaakceptowana i podpisana! Dziękujemy.');
            setContractDialogOpen(false);
            
        } catch (error) {
            toast.error('Wystąpił błąd podczas zapisywania umowy.');
            console.error(error);
        } finally {
            setIsSavingContract(false);
            setPendingSignature(null);
        }
    };

    const handleSendEmail = async () => {
        if (!activeQuote) return;
        setIsSendingEmail(true);
        try {
            await sendQuoteEmailToCustomer(activeQuote.id, token);
            toast.success('Potwierdzenie zostało wysłane na Twój adres email.');
        } catch (error) {
            toast.error('Wystąpił błąd podczas wysyłania emaila.');
            console.error(error);
        } finally {
            setIsSendingEmail(false);
        }
    };

    const pdfQuoteData = activeQuote && activeMontage ? {
        number: activeQuote.number,
        createdAt: activeQuote.createdAt,
        montage: {
            clientName: activeMontage.clientName,
            address: activeMontage.installationAddress || activeMontage.address || activeMontage.installationCity || '',
            contactEmail: activeMontage.contactEmail,
            contactPhone: activeMontage.contactPhone,
            isHousingVat: activeMontage.isHousingVat,
        },
        items: activeQuote.items,
        totalNet: activeQuote.items.reduce((acc, item) => acc + item.priceNet * item.quantity, 0),
        totalGross: activeQuote.totalGross,
        termsContent: activeQuote.termsContent,
        signatureData: activeQuote.signatureData,
        signedAt: activeQuote.signedAt,
    } : null;

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.5,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            className="container mx-auto p-4 max-w-4xl space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.div className="text-center space-y-2" variants={itemVariants}>
                <h1 className="text-3xl font-bold">Witaj, {customer.name}!</h1>
                <p className="text-muted-foreground">Panel Klienta Prime Podłoga</p>
            </motion.div>

            <div className="space-y-6">
                {activeMontage ? (
                    <motion.div variants={containerVariants} className="space-y-6">
                        
                        {/* Action Banner */}
                        {(activeQuote?.status === 'sent' || activeMontage.payments?.some(p => p.status === 'pending')) && (
                            <motion.div variants={itemVariants}>
                                <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <AlertTitle className="mb-2 font-semibold">Wymagane działanie</AlertTitle>
                                    <AlertDescription className="flex flex-col gap-2">
                                        {activeQuote?.status === 'sent' && (
                                            <div className="flex items-center justify-between gap-4">
                                                <span>Otrzymałeś nową wycenę. Prosimy o jej akceptację i podpisanie umowy.</span>
                                                <Button size="sm" variant="outline" className="whitespace-nowrap bg-white hover:bg-amber-100 text-amber-900 border-amber-200" onClick={() => {
                                                    const element = document.getElementById('quote-card');
                                                    element?.scrollIntoView({ behavior: 'smooth' });
                                                }}>
                                                    Przejdź do wyceny
                                                </Button>
                                            </div>
                                        )}
                                        {activeMontage.payments?.some(p => p.status === 'pending') && (
                                            <div className="flex items-center justify-between gap-4">
                                                <span>Masz nieopłacone płatności ({activeMontage.payments.filter(p => p.status === 'pending').length}).</span>
                                                <Button size="sm" variant="outline" className="whitespace-nowrap bg-white hover:bg-amber-100 text-amber-900 border-amber-200" onClick={() => {
                                                    const element = document.getElementById('payments-card');
                                                    element?.scrollIntoView({ behavior: 'smooth' });
                                                }}>
                                                    Przejdź do płatności
                                                </Button>
                                            </div>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        )}

                        {/* Action First: Data Request at the top */}
                        <motion.div variants={itemVariants}>
                            <DataRequestCard montage={activeMontage} token={token} />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <MontageTimeline montage={activeMontage} />
                        </motion.div>

                        {/* Installation Date Confirmation */}
                        {activeMontage.scheduledInstallationAt && !activeMontage.installationDateConfirmed && (
                            <motion.div variants={itemVariants}>
                                <InstallationDateCard 
                                    montageId={activeMontage.id}
                                    scheduledDate={activeMontage.scheduledInstallationAt}
                                    token={token}
                                />
                            </motion.div>
                        )}

                        {/* Payment Info */}
                        {activeMontage.payments && activeMontage.payments.length > 0 && (
                            <motion.div variants={itemVariants} id="payments-card">
                                <Card className="hover:shadow-md transition-shadow duration-300">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calculator className="h-5 w-5 text-primary" /> Płatności
                                        </CardTitle>
                                        <CardDescription>
                                            Historia płatności i dokumenty
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {[...activeMontage.payments]
                                            .sort((a, b) => {
                                                if (a.status === 'pending' && b.status === 'paid') return -1;
                                                if (a.status === 'paid' && b.status === 'pending') return 1;
                                                return 0;
                                            })
                                            .map((payment) => (
                                            <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{payment.name}</span>
                                                        {payment.status === 'paid' ? (
                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800 hover:bg-green-200">
                                                                Opłacona
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                                                Do zapłaty
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Kwota: <span className="font-medium text-foreground">{formatCurrency(parseFloat(payment.amount))}</span>
                                                    </p>
                                                    {payment.invoiceNumber && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Tytuł przelewu: <span className="font-mono select-all">{payment.invoiceNumber}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    {payment.proformaUrl && (
                                                        <Button variant="outline" size="sm" asChild>
                                                            <a href={payment.proformaUrl} target="_blank" rel="noopener noreferrer">
                                                                <FileText className="w-4 h-4 mr-2" />
                                                                Proforma
                                                            </a>
                                                        </Button>
                                                    )}
                                                    {payment.invoiceUrl && (
                                                        <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" asChild>
                                                            <a href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                                                <FileText className="w-4 h-4 mr-2" />
                                                                Faktura
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {bankAccount && (
                                            <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground mb-1">Dane do przelewu:</p>
                                                <p>{companyInfo.name}</p>
                                                <p className="font-mono select-all">{bankAccount}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                            <motion.div variants={itemVariants}>
                                <Card className="h-full hover:shadow-md transition-shadow duration-300">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-primary" /> Terminy
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-muted-foreground">Data zgłoszenia:</span>
                                            <span className="font-medium">
                                                {new Date(activeMontage.createdAt).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>
                                        {activeMontage.measurementDate && (
                                            <div className="flex justify-between border-b pb-2">
                                                <span className="text-muted-foreground">Data pomiaru:</span>
                                                <span className="font-medium">
                                                    {new Date(activeMontage.measurementDate).toLocaleDateString('pl-PL')}
                                                </span>
                                            </div>
                                        )}
                                        {activeMontage.forecastedInstallationDate && (
                                            <div className="flex justify-between border-b pb-2">
                                                <span className="text-muted-foreground">Planowany montaż:</span>
                                                <span className="font-medium">
                                                    {new Date(activeMontage.forecastedInstallationDate).toLocaleDateString('pl-PL')}
                                                </span>
                                            </div>
                                        )}
                                        {activeMontage.scheduledInstallationAt && (
                                            <div className="flex justify-between border-b pb-2">
                                                <span className="text-muted-foreground">Potwierdzony termin:</span>
                                                <span className="font-medium text-green-600">
                                                    {new Date(activeMontage.scheduledInstallationAt).toLocaleDateString('pl-PL')}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <Card className="h-full hover:shadow-md transition-shadow duration-300">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" /> Dokumenty
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {documents.length > 0 ? (
                                            <div className="space-y-2">
                                                {documents.map((att) => (
                                                    <a 
                                                        key={att.id} 
                                                        href={att.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors group"
                                                    >
                                                        <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{att.title || 'Dokument'}</span>
                                                        <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Brak udostępnionych dokumentów.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Measurement Results */}
                        {(activeMontage.floorArea || activeMontage.measurementDetails) && (
                            <motion.div variants={itemVariants}>
                                <Card className="hover:shadow-md transition-shadow duration-300">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Ruler className="h-5 w-5 text-primary" /> Wyniki Pomiaru
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 md:grid-cols-2">
                                        {activeMontage.floorArea && (
                                            <div className="space-y-1">
                                                <span className="text-sm text-muted-foreground">Powierzchnia podłogi</span>
                                                <p className="font-medium text-lg">{activeMontage.floorArea} m²</p>
                                                {activeMontage.floorDetails && <p className="text-sm text-muted-foreground">{activeMontage.floorDetails}</p>}
                                            </div>
                                        )}
                                        {activeMontage.measurementDetails && (
                                            <div className="col-span-full space-y-1 pt-2 border-t">
                                                <span className="text-sm text-muted-foreground">Uwagi z pomiaru</span>
                                                <p className="text-sm whitespace-pre-wrap">{activeMontage.measurementDetails}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Quote Acceptance */}
                        {activeQuote && (
                            <motion.div variants={itemVariants} id="quote-card">
                                <Card className={cn(
                                    "hover:shadow-md transition-shadow duration-300 border-l-4",
                                    activeQuote.status === 'accepted' ? "border-l-green-500" : "border-l-primary"
                                )}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calculator className="h-5 w-5 text-primary" /> Wycena {activeQuote.number}
                                        </CardTitle>
                                        <CardDescription>
                                            Data wystawienia: {new Date(activeQuote.createdAt).toLocaleDateString('pl-PL')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-muted-foreground">Wartość zamówienia (brutto):</span>
                                            <span className="text-2xl font-bold">
                                                {activeQuote.totalGross.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                                            </span>
                                        </div>
                                        {activeQuote.status === 'sent' && (
                                            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                                <p>Prosimy o zapoznanie się z wyceną. Aby rozpocząć realizację, wymagana jest akceptacja i podpisanie warunków.</p>
                                            </div>
                                        )}
                                        {activeQuote.status === 'accepted' && (
                                            <div className="space-y-4">
                                                <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300 flex items-center gap-2">
                                                    <Check className="h-4 w-4" />
                                                    <p>Wycena została zaakceptowana i podpisana {activeQuote.signedAt ? new Date(activeQuote.signedAt).toLocaleDateString('pl-PL') : ''}. Dziękujemy!</p>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-2">
                                                    {pdfQuoteData && (
                                                        <QuotePdfWrapper 
                                                            quote={pdfQuoteData} 
                                                            companyInfo={companyInfo}
                                                        />
                                                    )}
                                                    <Button variant="outline" onClick={handleSendEmail} disabled={isSendingEmail}>
                                                        <Mail className="w-4 h-4 mr-2" />
                                                        {isSendingEmail ? 'Wysyłanie...' : 'Wyślij na Email'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Contract Signing */}
                                        {activeQuote.status === 'sent' && activeQuote.termsContent && (
                                            <div className="mt-6 pt-4 border-t">
                                                <div className="space-y-4">
                                                    <p className="text-sm text-muted-foreground">
                                                        Do realizacji zamówienia wymagane jest podpisanie umowy (warunków współpracy).
                                                    </p>
                                                    <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
                                                        <DialogTrigger asChild>
                                                            <Button className="w-full sm:w-auto">
                                                                <FileText className="h-4 w-4 mr-2" />
                                                                Podgląd i podpisanie umowy
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="w-[95vw] max-w-5xl h-[90vh] flex flex-col sm:max-w-5xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Umowa / Warunki Współpracy</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="flex-1 overflow-y-auto border rounded-md p-8 bg-white text-black shadow-inner">
                                                                <style jsx global>{`
                                                                    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Open+Sans:wght@400;600&display=swap');
                                                                    
                                                                    .contract-preview-content {
                                                                        font-family: 'Merriweather', serif;
                                                                        line-height: 1.6;
                                                                        color: #1a1a1a;
                                                                        font-size: 11pt;
                                                                    }
                                                                    
                                                                    .contract-preview-content h1 {
                                                                        font-family: 'Open Sans', sans-serif;
                                                                        font-size: 24pt;
                                                                        font-weight: 700;
                                                                        text-transform: uppercase;
                                                                        text-align: center;
                                                                        margin-bottom: 10px;
                                                                        color: #000;
                                                                        letter-spacing: 1px;
                                                                    }
                                                                    
                                                                    .contract-preview-content h2 {
                                                                        font-family: 'Open Sans', sans-serif;
                                                                        font-size: 14pt;
                                                                        font-weight: 600;
                                                                        margin-top: 30px;
                                                                        margin-bottom: 15px;
                                                                        border-bottom: 1px solid #ddd;
                                                                        padding-bottom: 5px;
                                                                        color: #333;
                                                                    }
                                                                    
                                                                    .contract-preview-content p {
                                                                        margin-bottom: 10px;
                                                                        text-align: justify;
                                                                    }

                                                                    .contract-header {
                                                                        text-align: center;
                                                                        margin-bottom: 40px;
                                                                        padding-bottom: 20px;
                                                                        border-bottom: 2px solid #000;
                                                                    }
                                                                    
                                                                    .contract-meta {
                                                                        font-family: 'Open Sans', sans-serif;
                                                                        font-size: 10pt;
                                                                        color: #666;
                                                                        margin-top: 5px;
                                                                    }

                                                                    .parties-container {
                                                                        display: flex;
                                                                        justify-content: space-between;
                                                                        margin: 30px 0;
                                                                        gap: 40px;
                                                                    }
                                                                    
                                                                    .party-box {
                                                                        flex: 1;
                                                                        background: #f9fafb;
                                                                        padding: 20px;
                                                                        border: 1px solid #e5e7eb;
                                                                        border-radius: 4px;
                                                                    }
                                                                    
                                                                    .party-title {
                                                                        font-family: 'Open Sans', sans-serif;
                                                                        font-weight: 600;
                                                                        margin-bottom: 15px;
                                                                        color: #111;
                                                                        text-transform: uppercase;
                                                                        font-size: 10pt;
                                                                        letter-spacing: 0.5px;
                                                                    }
                                                                    
                                                                    .party-details {
                                                                        font-family: 'Open Sans', sans-serif;
                                                                        font-size: 10pt;
                                                                        color: #444;
                                                                        line-height: 1.6;
                                                                    }

                                                                    .contract-section {
                                                                        margin-bottom: 30px;
                                                                    }

                                                                    .signatures-section {
                                                                        margin-top: 60px;
                                                                        display: flex;
                                                                        justify-content: space-between;
                                                                        gap: 40px;
                                                                        page-break-inside: avoid;
                                                                    }
                                                                    
                                                                    .signature-box {
                                                                        flex: 1;
                                                                        text-align: center;
                                                                    }
                                                                    
                                                                    .signature-line {
                                                                        border-top: 1px solid #000;
                                                                        padding-top: 10px;
                                                                        font-family: 'Open Sans', sans-serif;
                                                                        font-size: 10pt;
                                                                        text-transform: uppercase;
                                                                    }
                                                                    
                                                                    .signature-image {
                                                                        height: 100px;
                                                                        display: flex;
                                                                        align-items: flex-end;
                                                                        justify-content: center;
                                                                        margin-bottom: 10px;
                                                                }
                                                                
                                                                .signature-image img {
                                                                    max-height: 80px;
                                                                    max-width: 100%;
                                                                }
                                                            `}</style>
                                                            
                                                            <div className="contract-preview-content">
                                                                <div className="text-center mb-8">
                                                                    <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Wycena / Umowa</h1>
                                                                    <p className="text-gray-500 font-sans">{activeQuote.number}</p>
                                                                </div>

                                                                {/* Quote Items Table */}
                                                                <div className="mb-12">
                                                                    <h2 className="text-lg font-bold font-sans border-b pb-2 mb-4">Specyfikacja Zamówienia</h2>
                                                                    <table className="w-full border-collapse text-sm font-sans">
                                                                        <thead>
                                                                            <tr className="bg-gray-50 border-b-2 border-gray-200">
                                                                                <th className="text-left py-3 px-2 font-semibold text-gray-700">Nazwa / Opis</th>
                                                                                <th className="text-right py-3 px-2 font-semibold text-gray-700">Ilość</th>
                                                                                <th className="text-right py-3 px-2 font-semibold text-gray-700">Cena Netto</th>
                                                                                <th className="text-right py-3 px-2 font-semibold text-gray-700">VAT</th>
                                                                                <th className="text-right py-3 px-2 font-semibold text-gray-700">Wartość Brutto</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {activeQuote.items?.map((item, i) => (
                                                                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                                                                                    <td className="py-3 px-2">{item.name}</td>
                                                                                    <td className="text-right py-3 px-2">{item.quantity} {item.unit}</td>
                                                                                    <td className="text-right py-3 px-2">{formatCurrency(item.priceNet)}</td>
                                                                                    <td className="text-right py-3 px-2">{item.vatRate * 100}%</td>
                                                                                    <td className="text-right py-3 px-2 font-medium">{formatCurrency(item.totalGross)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                        <tfoot>
                                                                            <tr className="border-t-2 border-gray-300">
                                                                                <td colSpan={4} className="text-right py-4 px-2 font-bold text-gray-800">Razem do zapłaty:</td>
                                                                                <td className="text-right py-4 px-2 font-bold text-xl text-primary">{formatCurrency(activeQuote.totalGross)}</td>
                                                                            </tr>
                                                                        </tfoot>
                                                                    </table>
                                                                </div>

                                                                {/* Terms Content */}
                                                                <div className="mb-8">
                                                                    <h2 className="text-lg font-bold font-sans border-b pb-2 mb-4">Warunki Współpracy</h2>
                                                                    <div dangerouslySetInnerHTML={{ __html: replaceVariables(activeQuote.termsContent || '') }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="pt-4 border-t bg-gray-50 p-4 -mx-6 -mb-6 mt-0">
                                                            <div className="max-w-md mx-auto">
                                                                <h4 className="font-semibold mb-2 text-center">Podpisz tutaj</h4>
                                                                <SignaturePad onSave={handleSignQuote} />
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>

                                                <Dialog open={emailConfirmOpen} onOpenChange={setEmailConfirmOpen}>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Potwierdzenie podpisu</DialogTitle>
                                                            <DialogDescription>
                                                                Czy chcesz otrzymać kopię podpisanej umowy na swój adres email?
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter className="flex gap-2 sm:justify-end">
                                                            <Button 
                                                                variant="outline" 
                                                                onClick={() => finalizeSignature(false)}
                                                                disabled={isSavingContract}
                                                            >
                                                                Nie, dziękuję
                                                            </Button>
                                                            <Button 
                                                                onClick={() => finalizeSignature(true)}
                                                                disabled={isSavingContract}
                                                            >
                                                                {isSavingContract ? 'Zapisywanie...' : 'Tak, wyślij kopię'}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {images.length > 0 && (
                            <motion.div variants={itemVariants}>
                                <Card className="hover:shadow-md transition-shadow duration-300">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ImageIcon className="h-5 w-5 text-primary" /> Galeria Zdjęć
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {images.map((img) => (
                                                <a 
                                                    key={img.id} 
                                                    href={img.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="block aspect-square relative rounded-md overflow-hidden border hover:opacity-90 transition-opacity group bg-muted"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img 
                                                        src={img.url} 
                                                        alt={img.title || 'Zdjęcie z montażu'} 
                                                        className="object-cover w-full h-full"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs font-medium px-2 text-center truncate w-full">
                                                            {img.title || 'Zobacz'}
                                                        </span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div variants={itemVariants}>
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="rounded-full bg-muted p-4 mb-4">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">Brak aktywnych zleceń</h3>
                                <p className="text-muted-foreground max-w-sm mt-2">
                                    Nie znaleźliśmy żadnych aktywnych zleceń przypisanych do Twojego konta.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
