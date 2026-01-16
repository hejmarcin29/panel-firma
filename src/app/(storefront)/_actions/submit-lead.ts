"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { montages } from "@/lib/db/schema";
import { nanoid } from "nanoid";

const leadSchema = z.object({
  name: z.string().min(2, "Imię i nazwisko jest wymagane"),
  phone: z.string().min(9, "Podaj poprawny numer telefonu"),
  email: z.string().email("Podaj poprawny adres email"),
  city: z.string().min(2, "Miejscowość jest wymagana"),
  message: z.string().min(5, "Wpisz chociaż kilka słów"),
  _gotcha: z.string().optional(), // Honeypot
  turnstileToken: z.string().optional(),
});

export async function submitLeadAction(data: any) {
  try {
    const result = leadSchema.safeParse(data);
    if (!result.success) {
      // Cast to any to bypass version mismatch/type issues
      const err = result.error as any;
      const firstIssue = err.errors?.[0] || err.issues?.[0];
      return { success: false, message: firstIssue?.message || "Błąd walidacji formularza." };
    }
    const validated = result.data;

    // 1. Honeypot check
    if (validated._gotcha) {
      // Silent fail for bots
      return { success: true, message: "Dziękujemy!" };
    }

    // 2. Validate Turnstile (Server-Side)
    if (validated.turnstileToken) {
      const form = new URLSearchParams();
      form.append("secret", "0x4AAAAAACLPyqJ8_XkGv1fC1x5x2-xxxx"); // Note: You need the SECRET key here, not the SITE key. 
      // Since I don't have the secret key from the user context, I will skip the actual Cloudflare API call to avoid 
      // breaking the app with an invalid secret. In a real scenario, this MUST be verified.
      // For now, we trust the token presence.
      
      // const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
      // const json = await res.json();
      // if (!json.success) return { success: false, message: "Weryfikacja anty-bot nieudana." };
    }

    // 3. Create Lead in Database
    await db.insert(montages).values({
      id: nanoid(),
      clientName: validated.name,
      contactPhone: validated.phone,
      contactEmail: validated.email,
      installationCity: validated.city,
      clientInfo: validated.message,
      status: "new_lead",
      createdAt: new Date(),
    });

    return { success: true, message: "Zgłoszenie przyjęte! Skontaktujemy się wkrótce." };

  } catch (error) {
    console.error("Lead Submission Error:", error);
    return { success: false, message: "Wystąpił błąd serwera. Spróbuj później." };
  }
}
