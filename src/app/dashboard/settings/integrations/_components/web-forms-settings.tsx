'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Copy, Code } from 'lucide-react';

export function WebFormsSettings() {
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const getCode = () => {
        const apiUrl = `${origin}/api/leads`;
        return `<!-- Formularz Leadów CRM -->
<div id="crm-lead-form" style="max-width: 400px; font-family: sans-serif;">
  <form onsubmit="submitCrmLead(event)">
    <div style="margin-bottom: 12px;">
      <label style="display:block; margin-bottom: 4px; font-weight: bold; font-size: 14px;">Imię i nazwisko *</label>
      <input type="text" name="name" required placeholder="Jan Kowalski" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
    </div>
    
    <div style="margin-bottom: 12px;">
      <label style="display:block; margin-bottom: 4px; font-weight: bold; font-size: 14px;">Telefon</label>
      <input type="tel" name="phone" placeholder="123 456 789" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
    </div>
    
    <div style="margin-bottom: 12px;">
      <label style="display:block; margin-bottom: 4px; font-weight: bold; font-size: 14px;">Email</label>
      <input type="email" name="email" placeholder="jan@example.com" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
    </div>

     <div style="margin-bottom: 12px;">
      <label style="display:block; margin-bottom: 4px; font-weight: bold; font-size: 14px;">Miasto</label>
      <input type="text" name="city" placeholder="Warszawa" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
    </div>
    
    <div style="margin-bottom: 16px;">
      <label style="display:block; margin-bottom: 4px; font-weight: bold; font-size: 14px;">Wiadomość</label>
      <textarea name="message" rows="3" placeholder="Interesuje mnie wylewka..." style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; resize: vertical;"></textarea>
    </div>
    
    <button type="submit" style="background: #2563eb; color: #fff; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold;">Wyślij zgłoszenie</button>
  </form>
  <div id="crm-form-status" style="margin-top: 10px; display: none; padding: 10px; border-radius: 4px; text-align: center; font-size: 14px;"></div>
</div>

<script>
async function submitCrmLead(e) {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById('crm-form-status');
  const btn = form.querySelector('button');
  const originalText = btn.innerText;
  
  const data = {
    name: form.name.value,
    phone: form.phone.value,
    email: form.email.value,
    city: form.city.value,
    message: form.message.value
  };
  
  btn.disabled = true;
  btn.innerText = 'Wysyłanie...';
  status.style.display = 'none';

  try {
    const res = await fetch('${apiUrl}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    
    if (json.success || json.status === 'duplicate_found') {
      status.innerText = 'Dziękujemy! Twoje zgłoszenie zostało przyjęte.';
      status.style.backgroundColor = '#dcfce7';
      status.style.color = '#166534';
      form.reset();
    } else {
      status.innerText = 'Błąd: ' + (json.message || 'Spróbuj ponownie.');
      status.style.backgroundColor = '#fee2e2';
      status.style.color = '#991b1b';
    }
  } catch (err) {
    status.innerText = 'Wystąpił błąd połączenia.';
    status.style.backgroundColor = '#fee2e2';
    status.style.color = '#991b1b';
  } finally {
    status.style.display = 'block';
    btn.disabled = false;
    btn.innerText = originalText;
  }
}
</script>`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getCode());
        toast.success('Kod skopiowany do schowka');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Generator Formularza WWW
                </CardTitle>
                <CardDescription>
                    Skopiuj poniższy kod HTML i wklej go na swojej stronie WordPress (np. w bloku "Własny HTML").
                    Formularz automatycznie prześle zgłoszenia do zakładki Montaże > Leady.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Textarea 
                        value={getCode()} 
                        readOnly 
                        className="font-mono text-xs h-[300px] bg-muted/50"
                    />
                    <Button 
                        size="sm" 
                        className="absolute top-2 right-2" 
                        onClick={handleCopy}
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Kopiuj kod
                    </Button>
                </div>
                
                <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm">
                    <strong>Wskazówka:</strong> Możesz dowolnie zmieniać style CSS w powyższym kodzie, aby dopasować formularz do wyglądu swojej strony. Ważne, aby zachować atrybuty <code>name</code> w polach (name, phone, email, city, message).
                </div>
            </CardContent>
        </Card>
    );
}

function Globe({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
        </svg>
    )
}
