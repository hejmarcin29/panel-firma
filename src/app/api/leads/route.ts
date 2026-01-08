import { NextResponse } from 'next/server';
import { createLeadCore } from '@/lib/crm/lead-service';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Honeypot logic: If _gotcha is filled, it's a bot.
        // We return success to trick the bot, but don't save the lead.
        if (body._gotcha) {
            console.log('SPAM Honeypot triggered:', body);
            return NextResponse.json(
                { success: true, message: 'Message received' }, 
                { 
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                }
            );
        }
        
        // Basic validation
        if (!body.name) {
            return NextResponse.json(
                { success: false, message: 'Brak nazwy klienta' }, 
                { 
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                }
            );
        }

        const result = await createLeadCore({
            clientName: body.name,
            contactPhone: body.phone,
            contactEmail: body.email,
            address: body.city,
            description: body.message,
            source: 'internet',
        });

        // Always return success 200 even if duplicate/error logic handled gracefully,
        // unless it's a critical error, but for lead gen forms we usually want to say "Received".
        // But createLeadCore returns detail.

        return NextResponse.json(result, {
            status: result.success || result.status === 'duplicate_found' ? 200 : 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

    } catch (error) {
        console.error('API Lead Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' }, 
            { 
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
