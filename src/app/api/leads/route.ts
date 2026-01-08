import { NextResponse } from 'next/server';
import { createLeadCore } from '@/lib/crm/lead-service';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Honeypot logic: If _gotcha is filled, it's a bot.
        // We return success to trick the bot, but don't save the lead.
        if (body._gotcha) {
            console.log('SPAM Honeypot triggered:', body);
            return NextResponse.json(
                { success: true, message: 'Message received' }, 
                { 
                    status: 200,
                    headers: corsHeaders
                }
            );
        }

        // Turnstile Verification
        const turnstileSecret = await getAppSetting(appSettingKeys.cloudflareTurnstileSecretKey);
        
        if (turnstileSecret) {
            const token = body['cf-turnstile-response'];
            
            // If secret is configured, we require the token
            if (!token) {
                console.warn('Turnstile token missing but secret key configured.');
                return NextResponse.json(
                    { success: false, message: 'Weryfikacja anty-bot (CAPTCHA) jest wymagana.' },
                    { status: 400, headers: corsHeaders }
                );
            }

            const formData = new FormData();
            formData.append('secret', turnstileSecret);
            formData.append('response', token);
            // x-forwarded-for might be a list, take first
            const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
            if (ip) {
                formData.append('remoteip', ip);
            }

            try {
                const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                    body: formData,
                    method: 'POST',
                });

                const outcome = await turnstileResult.json();
                
                if (!outcome.success) {
                    console.error('Turnstile verification failed:', outcome);
                    return NextResponse.json(
                        { success: false, message: 'Weryfikacja anty-bot nie powiodła się. Spróbuj ponownie.' },
                        { status: 400, headers: corsHeaders }
                    );
                }
            } catch (verError) {
                console.error('Turnstile connection error:', verError);
                // Fail open or closed? If we can't reach Cloudflare, we probably shouldn't block legitimate users 
                // BUT for security "Fail Closed" is better. 
                // Let's allow it with a warning log for now to avoid losing leads on network blips, 
                // OR duplicate the logic of "catch" below.
                // Let's stick strictly to responding with error if verification fails to execute.
                 return NextResponse.json(
                    { success: false, message: 'Błąd weryfikacji serwera zabezpieczeń.' },
                    { status: 500, headers: corsHeaders }
                );
            }
        }
        
        // Basic validation
        const missingFields = [];
        if (!body.name) missingFields.push('Imię i nazwisko');
        if (!body.email) missingFields.push('Email');
        if (!body.phone) missingFields.push('Telefon');
        if (!body.city) missingFields.push('Miejscowość');
        if (!body.description) missingFields.push('Treść wiadomości');

        if (missingFields.length > 0) {
            return NextResponse.json(
                { success: false, message: `Wypełnij wymagane pola: ${missingFields.join(', ')}` }, 
                { 
                    status: 400,
                    headers: corsHeaders
                }
            );
        }

        // Phone validation (PL standard: 9 digits)
        const cleanPhone = body.phone.replace(/\D/g, ''); // Remove non-digits
        if (cleanPhone.length !== 9) {
             return NextResponse.json(
                { success: false, message: 'Podaj poprawny, 9-cyfrowy numer telefonu.' }, 
                { 
                    status: 400,
                    headers: corsHeaders
                }
            );
        }

        const result = await createLeadCore({
            clientName: body.name,
            contactPhone: body.phone, // Pass original formatting or cleaned? Usually original is friendlier for display, but cleaned is better for search. Let's pass original, we clean in service for search.
            contactEmail: body.email,
            address: body.city,
            description: body.description,
            sendNotification: true
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
