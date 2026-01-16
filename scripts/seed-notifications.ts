
import { db } from '@/lib/db';
import { notificationTemplates } from '@/lib/db/schema';
import { NOTIFICATION_EVENTS, NotificationEventId } from '@/lib/notifications/events';
import { eq } from 'drizzle-orm';

const EMAIL_TEMPLATES: Partial<Record<NotificationEventId, { subject: string, content: string }>> = {
    ORDER_CREATED: {
        subject: 'Potwierdzenie zamówienia #{{order_id}} - Prime Podłoga',
        content: `
<h1>Dziękujemy za zamówienie!</h1>
<p>Cześć <strong>{{client_name}}</strong>,</p>
<p>Twoje zamówienie <strong>#{{order_id}}</strong> zostało przyjęte do realizacji. Dziękujemy za zaufanie!</p>

<h3>Podsumowanie:</h3>
<p>Kwota: <strong>{{total_amount}}</strong></p>
<p><a href="{{order_link}}">Kliknij tutaj, aby zobaczyć szczegóły zamówienia</a></p>

<p>O kolejnych etapach (płatność, wysyłka) będziemy informować w kolejnych wiadomościach.</p>

<hr />
<p style="font-size: 12px; color: #888;">Zespół Prime Podłoga</p>
`
    },
    ORDER_PAID: {
        subject: 'Płatność przyjęta - Zamówienie #{{order_id}}',
        content: `
<h1>Otrzymaliśmy płatność ✅</h1>
<p>Dzień dobry,</p>
<p>Zabieramy się za pakowanie Twojego zamówienia <strong>#{{order_id}}</strong>.</p>
<p>Metoda płatności: {{payment_method}}</p>

<p>Poinformujemy Cię, gdy kurier odbiorze paczkę.</p>
`
    },
    ORDER_SHIPPED: {
        subject: 'Twoje zamówienie #{{order_id}} jest w drodze! 🚚',
        content: `
<h1>Wyruszyliśmy!</h1>
<p>Twoje produkty właśnie opuściły nasz magazyn.</p>
<p>Przewoźnik: <strong>{{carrier}}</strong></p>
<p>Numer śledzenia: <strong>{{tracking_number}}</strong></p>

<p><a href="{{tracking_link}}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Śledź przesyłkę</a></p>
`
    },
    QUOTE_SENT: {
        subject: 'Twoja wycena podłogi #{{quote_number}}',
        content: `
<h2>Oto Twoja wycena</h2>
<p>Cześć <strong>{{client_name}}</strong>,</p>
<p>Przygotowaliśmy ofertę idealnie dopasowaną do Twoich potrzeb.</p>
<h3>Kwota: {{total_amount}}</h3>

<p>Zapoznaj się z PDF w załączniku lub kliknij poniżej, aby zaakceptować ofertę online:</p>
<p><a href="{{quote_link}}">Zobacz Ofertę Online</a></p>

<p>Wycena jest ważna przez 7 dni.</p>
`
    },
    MONTAGE_SCHEDULED: {
        subject: 'Potwierdzenie terminu montażu - {{date}}',
        content: `
<h2>Termin Montażu Potwierdzony 🛠️</h2>
<p>Dzień dobry,</p>
<p>Potwierdzamy termin montażu dla zlecenia <strong>{{montage_number}}</strong>.</p>

<ul>
<li><strong>Data:</strong> {{date}}</li>
<li><strong>Godzina:</strong> {{time}}</li>
<li><strong>Adres:</strong> {{address}}</li>
<li><strong>Ekipa:</strong> {{installer_name}}</li>
</ul>

<p>Prosimy o przygotowanie pomieszczeń zgodnie z instrukcją dostępną w naszym poradniku.</p>
`
    },
    MEASUREMENT_SCHEDULED: {
        subject: 'Potwierdzenie terminu pomiaru - {{date}}',
        content: `
<h2>Termin Pomiaru 📏</h2>
<p>Dzień dobry,</p>
<p>Potwierdzamy termin wizyty pomiarowej dla zlecenia <strong>{{montage_number}}</strong>.</p>
<p>Nasz technik dokona niezbędnych pomiarów wilgotności i metrażu.</p>

<ul>
<li><strong>Data:</strong> {{date}}</li>
<li><strong>Godzina:</strong> {{time}}</li>
<li><strong>Adres:</strong> {{address}}</li>
</ul>

<p>Prosimy o zapewnienie dostępu do mierzonych pomieszczeń.</p>
`
    },
    CLIENT_DATA_REQUEST: {
        subject: 'Witamy w Panelu Klienta - Prime Podłoga',
        content: `
<h2>Zapraszamy do Panelu Klienta</h2>
<p>Dzień dobry!</p>
<p>Rozpoczynamy współpracę. Utworzyliśmy dla Ciebie Panel Klienta, gdzie będziesz widzieć postępy prac.</p>
<p><a href="{{portal_link}}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Przejdź do Panelu</a></p>

<p>Prosimy o uzupełnienie adresu, abyśmy mogli zlecić pomiar.</p>
`
    }
};

const SMS_TEMPLATES: Partial<Record<NotificationEventId, string>> = {
    ORDER_CREATED: 'Dziekujemy za zamowienie #{{order_id}} w Prime Podloga! Szczegoly wyslalismy na maila. Pozdrawiamy!',
    ORDER_SHIPPED: 'Twoje zamowienie #{{order_id}} zostalo wyslane! Kurier: {{carrier}}, Nr: {{tracking_number}}. Sledz przesylke: {{tracking_link}}',
    MONTAGE_SCHEDULED: 'Potwierdzamy montaz podlogi: {{date}} o godz. {{time}}. Adres: {{address}}. Do zobaczenia! Prime Podloga',
    MEASUREMENT_SCHEDULED: 'Potwierdzamy pomiar: {{date}}, {{time}}. Adres: {{address}}. Technik Prime Podloga',
    CLIENT_DATA_REQUEST: 'Witamy w Prime Podloga! Prosze uzupelnic dane do pomiaru w panelu klienta: {{portal_link}}'
};

async function seed() {
    console.log('🌱 Seeding notification templates...');

    for (const [key, eventDef] of Object.entries(NOTIFICATION_EVENTS)) {
        const eventId = key as NotificationEventId;
        
        // 1. Seed Email
        const emailContent = EMAIL_TEMPLATES[eventId];
        if (emailContent) {
            const existing = await db.query.notificationTemplates.findFirst({
                where: (t, { and, eq }) => and(eq(t.eventId, eventId), eq(t.channel, 'email'))
            });

            if (!existing) {
                await db.insert(notificationTemplates).values({
                    eventId,
                    channel: 'email',
                    subject: emailContent.subject,
                    content: emailContent.content,
                    isActive: true
                });
                console.log(`✅ Created Email template for ${eventId}`);
            } else {
                console.log(`⏭️ Email template for ${eventId} already exists`);
            }
        }

        // 2. Seed SMS
        const smsContent = SMS_TEMPLATES[eventId];
        if (smsContent) {
            const existing = await db.query.notificationTemplates.findFirst({
                where: (t, { and, eq }) => and(eq(t.eventId, eventId), eq(t.channel, 'sms'))
            });

            if (!existing) {
                await db.insert(notificationTemplates).values({
                    eventId,
                    channel: 'sms',
                    content: smsContent,
                    isActive: true
                });
                console.log(`✅ Created SMS template for ${eventId}`);
            } else {
                console.log(`⏭️ SMS template for ${eventId} already exists`);
            }
        }
    }
    console.log('✨ Seeding complete!');
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
