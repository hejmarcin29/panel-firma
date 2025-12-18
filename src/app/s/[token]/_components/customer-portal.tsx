'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FileText, Calendar, CheckCircle2, Circle, Image as ImageIcon, Ruler, Calculator, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { signContract } from '../actions';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { SignaturePad } from '@/components/ui/signature-pad';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface MontageAttachment {
    id: string;
    url: string;
    title: string | null;
}

interface Contract {
    id: string;
    status: 'draft' | 'sent' | 'signed' | 'rejected';
    content: string;
    signedAt: Date | null;
    signatureData: string | null;
}

interface Quote {
    id: string;
    number: string | null;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    totalGross: number;
    createdAt: Date;
    validUntil: Date | null;
    contract: Contract | null;
}

interface Montage {
    id: string;
    displayId: string | null;
    clientName: string;
    status: string;
    createdAt: Date;
    forecastedInstallationDate: Date | null;
    scheduledInstallationAt: Date | null;
    attachments: MontageAttachment[];
    quotes: Quote[];
    floorArea: number | null;
    floorDetails: string | null;
    skirtingLength: number | null;
    skirtingDetails: string | null;
    measurementDetails: string | null;
}

interface Customer {
    name: string | null;
    montages: Montage[];
}

interface CustomerPortalProps {
    customer: Customer;
    token: string;
}

const STATUS_STEPS = [
    { id: 'lead', label: 'Zgłoszenie', description: 'Otrzymaliśmy Twoje zgłoszenie' },
    { id: 'measurement', label: 'Pomiar', description: 'Umawiamy termin pomiaru' },
    { id: 'valuation', label: 'Wycena', description: 'Przygotowujemy ofertę' },
    { id: 'acceptance', label: 'Akceptacja', description: 'Czekamy na Twoją decyzję' },
    { id: 'deposit', label: 'Zaliczka', description: 'Oczekujemy na wpłatę' },
    { id: 'in_progress', label: 'Realizacja', description: 'Montaż w toku' },
    { id: 'completed', label: 'Zakończone', description: 'Prace zakończone' },
];

function getStepStatus(currentStatus: string, stepId: string) {
    const currentIndex = STATUS_STEPS.findIndex(s => s.id === currentStatus);
    const stepIndex = STATUS_STEPS.findIndex(s => s.id === stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
}

export function CustomerPortal({ customer, token }: CustomerPortalProps) {
    const activeMontage = customer.montages[0]; // For now, just take the latest one
    const [contractDialogOpen, setContractDialogOpen] = useState(false);

    const isImage = (url: string) => {
        return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
    };

    const images = activeMontage?.attachments.filter(att => isImage(att.url)) || [];
    const documents = activeMontage?.attachments.filter(att => !isImage(att.url)) || [];
    const activeQuote = activeMontage?.quotes.find(q => q.status === 'sent' || q.status === 'accepted');

    const handleSignContract = async (signatureData: string) => {
        if (!activeQuote?.contract) return;
        
        try {
            await signContract(activeQuote.contract.id, signatureData, token);
            toast.success('Umowa została podpisana! Dziękujemy.');
            setContractDialogOpen(false);
        } catch (error) {
            toast.error('Wystąpił błąd podczas podpisywania umowy.');
            console.error(error);
        }
    };

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
                <p className="text-muted-foreground">Panel Klienta Prime Podłogi</p>
            </motion.div>

            <div className="space-y-6">
                {activeMontage ? (
                    <motion.div variants={containerVariants} className="space-y-6">
                        <motion.div variants={itemVariants}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Status Realizacji</CardTitle>
                                    <CardDescription>
                                        Śledź postęp swojego zamówienia: {activeMontage.displayId || activeMontage.clientName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative flex flex-col gap-6 md:flex-row md:justify-between md:gap-2">
                                        {/* Progress Bar Background (Desktop) */}
                                        <div className="absolute top-4 left-0 hidden h-0.5 w-full bg-muted md:block" />
                                        
                                        {STATUS_STEPS.map((step, index) => {
                                            const status = getStepStatus(activeMontage.status, step.id);
                                            return (
                                                <motion.div 
                                                    key={step.id} 
                                                    className="relative flex flex-row items-start gap-4 md:flex-col md:items-center md:gap-2 md:text-center z-10"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <div className={cn(
                                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                                                        status === 'completed' ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" :
                                                        status === 'current' ? "border-primary bg-background text-primary ring-4 ring-primary/10" :
                                                        "border-muted bg-background text-muted-foreground"
                                                    )}>
                                                        {status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                                                            status === 'current' ? <Circle className="h-4 w-4 fill-current animate-pulse" /> :
                                                            <Circle className="h-4 w-4" />}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 pt-1 md:pt-0">
                                                        <span className={cn("text-sm font-medium transition-colors duration-300", status === 'current' && "text-primary")}>
                                                            {step.label}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground md:max-w-[100px]">
                                                            {step.description}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

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
                        {(activeMontage.floorArea || activeMontage.skirtingLength || activeMontage.measurementDetails) && (
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
                                        {activeMontage.skirtingLength && (
                                            <div className="space-y-1">
                                                <span className="text-sm text-muted-foreground">Długość listew</span>
                                                <p className="font-medium text-lg">{activeMontage.skirtingLength} mb</p>
                                                {activeMontage.skirtingDetails && <p className="text-sm text-muted-foreground">{activeMontage.skirtingDetails}</p>}
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
                            <motion.div variants={itemVariants}>
                                <Card className={cn(
                                    "hover:shadow-md transition-shadow duration-300 border-l-4",
                                    activeQuote.status === 'accepted' ? "border-l-green-500" : "border-l-primary"
                                )}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            {activeQuote.contract ? (
                                                <>
                                                    <FileText className="h-5 w-5 text-primary" /> Umowa
                                                </>
                                            ) : (
                                                <>
                                                    <Calculator className="h-5 w-5 text-primary" /> Wycena {activeQuote.number}
                                                </>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            Data wystawienia: {new Date(activeQuote.createdAt).toLocaleDateString('pl-PL')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-muted-foreground">Wartość zamówienia (brutto):</span>
                                            <span className="text-2xl font-bold">
                                                {(activeQuote.totalGross / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                                            </span>
                                        </div>
                                        {activeQuote.status === 'sent' && !activeQuote.contract && (
                                            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                                <p>Prosimy o zapoznanie się z wyceną. Aby rozpocząć realizację, wymagana jest akceptacja.</p>
                                            </div>
                                        )}
                                        {activeQuote.status === 'accepted' && !activeQuote.contract && (
                                            <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300 flex items-center gap-2">
                                                <Check className="h-4 w-4" />
                                                <p>Wycena została zaakceptowana. Dziękujemy!</p>
                                            </div>
                                        )}

                                        {activeQuote.status === 'sent' && (!activeQuote.contract || activeQuote.contract.status === 'rejected') && (
                                            <div className="mt-4 pt-4 border-t">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <p className="text-sm">Umowa jest przygotowywana. Prosimy o cierpliwość.</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Contract Signing */}
                                        {activeQuote.contract && activeQuote.contract.status !== 'rejected' && (
                                            <div className="mt-6 pt-4 border-t">
                                                {activeQuote.contract.status === 'signed' ? (
                                                    <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300 flex items-center gap-2">
                                                        <Check className="h-4 w-4" />
                                                        <p>Umowa została podpisana {activeQuote.contract.signedAt ? new Date(activeQuote.contract.signedAt).toLocaleDateString('pl-PL') : ''}.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <p className="text-sm text-muted-foreground">
                                                            Do realizacji zamówienia wymagane jest podpisanie umowy.
                                                        </p>
                                                        <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
                                                            <DialogTrigger asChild>
                                                                <Button className="w-full sm:w-auto">
                                                                    <FileText className="h-4 w-4 mr-2" />
                                                                    Podgląd i podpisanie umowy
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                                                                <DialogHeader>
                                                                    <DialogTitle>Umowa</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-white text-black">
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
                                                                <div className="contract-preview-content" dangerouslySetInnerHTML={{ __html: activeQuote.contract.content }} />
                                                            </div>
                                                            <div className="pt-4 border-t">
                                                                <h4 className="font-semibold mb-2">Podpis</h4>
                                                                <SignaturePad onSave={handleSignContract} />
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            )}
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
