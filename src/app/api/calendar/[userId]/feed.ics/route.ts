import { NextRequest, NextResponse } from 'next/server';
import { eq, or, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { montages } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

function formatDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeText(text: string | null | undefined): string {
    if (!text) return '';
    return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    const userId = params.userId.replace('.ics', ''); // Handle if the param captures the extension or not, though folder structure usually handles it.
    // Actually, if the folder is [userId], and we call /api/calendar/123/feed.ics, we might need a different structure.
    // Let's stick to /api/calendar/[userId]/route.ts and the user can append ?format=ics or just serve it.
    // But user wants a link ending in .ics usually.
    // Let's use the folder structure: src/app/api/calendar/[userId]/feed.ics/route.ts
    // In this case, params will contain userId.
    
    if (!userId) {
        return new NextResponse('User ID required', { status: 400 });
    }

    const userMontages = await db.query.montages.findMany({
        where: and(
            or(
                eq(montages.installerId, userId),
                eq(montages.measurerId, userId)
            ),
            isNull(montages.deletedAt)
        ),
        with: {
            customer: true,
        }
    });

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Panel Firma//Montaze//PL',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Moje Montaże',
        'X-WR-TIMEZONE:Europe/Warsaw',
    ];

    for (const montage of userMontages) {
        const clientName = montage.clientName || montage.customer?.name || 'Klient';
        const address = [montage.city, montage.address, montage.postalCode].filter(Boolean).join(', ');
        const phone = montage.contactPhone || montage.customer?.phone || '';
        const url = `https://b2b.primepodloga.pl/dashboard/crm/montaze/${montage.id}`;
        
        // 1. Measurement Event
        if (montage.measurementDate && montage.measurerId === userId) {
            const start = new Date(montage.measurementDate);
            // Assuming measurement takes 2 hours by default if no end time
            const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); 
            
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:measurement-${montage.id}@panel-firma`,
                `DTSTAMP:${formatDate(new Date())}`,
                `DTSTART:${formatDate(start)}`,
                `DTEND:${formatDate(end)}`,
                `SUMMARY:Pomiar: ${escapeText(clientName)}`,
                `DESCRIPTION:${escapeText(`Adres: ${address}\nTelefon: ${phone}\nLink: ${url}`)}`,
                `LOCATION:${escapeText(address)}`,
                'STATUS:CONFIRMED',
                'END:VEVENT'
            );
        }

        // 2. Installation Event
        if (montage.scheduledInstallationAt && montage.installerId === userId) {
            const start = new Date(montage.scheduledInstallationAt);
            let end = montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : null;
            
            // If no end date, assume 8 hours or same day
            if (!end) {
                end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
            }

            icsContent.push(
                'BEGIN:VEVENT',
                `UID:installation-${montage.id}@panel-firma`,
                `DTSTAMP:${formatDate(new Date())}`,
                `DTSTART:${formatDate(start)}`,
                `DTEND:${formatDate(end)}`,
                `SUMMARY:Montaż: ${escapeText(clientName)}`,
                `DESCRIPTION:${escapeText(`Adres: ${address}\nTelefon: ${phone}\nLink: ${url}`)}`,
                `LOCATION:${escapeText(address)}`,
                'STATUS:CONFIRMED',
                'END:VEVENT'
            );
        }
    }

    icsContent.push('END:VCALENDAR');

    return new NextResponse(icsContent.join('\r\n'), {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="montaze-${userId}.ics"`,
        },
    });
}
