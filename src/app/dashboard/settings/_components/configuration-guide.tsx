"use client";

import { BookOpen, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type GuideType = "google" | "r2" | "woocommerce";

const guides: Record<
  GuideType,
  {
    title: string;
    description: string;
    steps: { title: string; content: React.ReactNode }[];
  }
> = {
  google: {
    title: "Konfiguracja Google Calendar",
    description:
      "Postępuj zgodnie z instrukcją, aby połączyć panel z Kalendarzem Google.",
    steps: [
      {
        title: "1. Utwórz projekt w Google Cloud",
        content: (
          <div className="space-y-2">
            <p>
              Wejdź na stronę{" "}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Google Cloud Console <ExternalLink className="h-3 w-3" />
              </a>{" "}
              i utwórz nowy projekt (lub wybierz istniejący).
            </p>
          </div>
        ),
      },
      {
        title: "2. Włącz API Kalendarza",
        content: (
          <div className="space-y-2">
            <p>
              W menu bocznym wybierz <strong>APIs & Services</strong> &gt;{" "}
              <strong>Library</strong>.
            </p>
            <p>
              Wyszukaj <code>Google Calendar API</code> i kliknij{" "}
              <strong>Enable</strong>.
            </p>
          </div>
        ),
      },
      {
        title: "3. Utwórz Service Account",
        content: (
          <div className="space-y-2">
            <p>
              Przejdź do <strong>APIs & Services</strong> &gt;{" "}
              <strong>Credentials</strong>.
            </p>
            <p>
              Kliknij <strong>Create Credentials</strong> i wybierz{" "}
              <strong>Service Account</strong>.
            </p>
            <p>Nadaj nazwę (np. &quot;Panel Firmy&quot;) i kliknij Create.</p>
            <p>
              Skopiuj adres email utworzonego konta (np.{" "}
              <code>panel@twoj-projekt.iam.gserviceaccount.com</code>).
            </p>
          </div>
        ),
      },
      {
        title: "4. Wygeneruj klucz JSON",
        content: (
          <div className="space-y-2">
            <p>Kliknij w utworzony Service Account (ikonka ołówka).</p>
            <p>
              Przejdź do zakładki <strong>Keys</strong>.
            </p>
            <p>
              Kliknij <strong>Add Key</strong> &gt; <strong>Create new key</strong>{" "}
              &gt; <strong>JSON</strong>.
            </p>
            <p>
              Pobierze się plik. Otwórz go w notatniku. Będziesz potrzebować:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
              <li>
                <code>client_email</code> (do zmiennej{" "}
                <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code>)
              </li>
              <li>
                <code>private_key</code> (cały tekst zaczynający się od{" "}
                <code>-----BEGIN PRIVATE KEY...</code> do zmiennej{" "}
                <code>GOOGLE_PRIVATE_KEY</code>)
              </li>
            </ul>
          </div>
        ),
      },
      {
        title: "5. Udostępnij Kalendarz (WAŻNE!)",
        content: (
          <div className="space-y-2">
            <p>
              Wejdź na{" "}
              <a
                href="https://calendar.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                calendar.google.com
              </a>
              .
            </p>
            <p>
              Znajdź swój kalendarz po lewej stronie, kliknij trzy kropki &gt;{" "}
              <strong>Ustawienia i udostępnianie</strong>.
            </p>
            <p>
              W sekcji &quot;Udostępnij określonym osobom&quot; kliknij{" "}
              <strong>Dodaj osoby</strong>.
            </p>
            <p>
              Wklej email Service Accounta (z kroku 3) i wybierz uprawnienia:{" "}
              <strong>Dokonywanie zmian w wydarzeniach</strong>.
            </p>
          </div>
        ),
      },
      {
        title: "6. Pobierz ID Kalendarza",
        content: (
          <div className="space-y-2">
            <p>
              Będąc w ustawieniach kalendarza, przewiń na sam dół do sekcji{" "}
              <strong>Integrowanie kalendarza</strong>.
            </p>
            <p>
              Skopiuj <strong>Identyfikator kalendarza</strong> (zazwyczaj to Twój
              adres email).
            </p>
            <p>
              Wklej go do zmiennej <code>GOOGLE_CALENDAR_ID</code>.
            </p>
          </div>
        ),
      },
    ],
  },
  r2: {
    title: "Konfiguracja Cloudflare R2",
    description:
      "Instrukcja podłączenia taniego i szybkiego hostingu plików R2.",
    steps: [
      {
        title: "1. Utwórz Bucket",
        content: (
          <div className="space-y-2">
            <p>
              Zaloguj się do{" "}
              <a
                href="https://dash.cloudflare.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Cloudflare Dashboard
              </a>{" "}
              i wybierz <strong>R2</strong> z menu.
            </p>
            <p>Kliknij &quot;Create bucket&quot;, nadaj mu nazwę (np. &quot;panel-pliki&quot;).</p>
          </div>
        ),
      },
      {
        title: "2. Pobierz Account ID",
        content: (
          <div className="space-y-2">
            <p>
              Na głównej stronie R2 (lista bucketów), po prawej stronie znajdziesz{" "}
              <strong>Account ID</strong>. Skopiuj go.
            </p>
          </div>
        ),
      },
      {
        title: "3. Wygeneruj klucze API",
        content: (
          <div className="space-y-2">
            <p>
              Na głównej stronie R2 kliknij link{" "}
              <strong>Manage R2 API Tokens</strong> (po prawej).
            </p>
            <p>Kliknij &quot;Create API token&quot;.</p>
            <p>
              Uprawnienia: Wybierz <strong>Object Read & Write</strong>.
            </p>
            <p>
              Zatwierdź. Skopiuj <strong>Access Key ID</strong> oraz{" "}
              <strong>Secret Access Key</strong>.
            </p>
          </div>
        ),
      },
      {
        title: "4. Konfiguracja CORS (Dla uploadu)",
        content: (
          <div className="space-y-2">
            <p>Wejdź w ustawienia swojego Bucketa &gt; Settings.</p>
            <p>Znajdź sekcję CORS Policy i dodaj regułę:</p>
            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
              {`[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"]
  }
]`}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-6 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(`[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"]
  }
]`);
                toast.success("Skopiowano JSON do schowka");
              }}
            >
              <Copy className="mr-1 h-3 w-3" /> Kopiuj JSON
            </Button>
          </div>
        ),
      },
      {
        title: "5. Publiczny dostęp (Opcjonalnie)",
        content: (
          <div className="space-y-2">
            <p>
              W ustawieniach Bucketa możesz włączyć{" "}
              <strong>R2.dev subdomain</strong> (do testów) lub podpiąć własną
              domenę (Custom Domain).
            </p>
            <p>
              Adres publiczny wpisz w polu <strong>Publiczny URL</strong> (bez
              ukośnika na końcu).
            </p>
          </div>
        ),
      },
    ],
  },
  woocommerce: {
    title: "Konfiguracja WooCommerce",
    description: "Jak połączyć sklep WooCommerce z panelem.",
    steps: [
      {
        title: "1. Wygeneruj Sekret",
        content: (
          <div className="space-y-2">
            <p>
              Wymyśl długie, losowe hasło (min. 16 znaków). Możesz wpisać
              cokolwiek, byle było trudne do zgadnięcia.
            </p>
            <p>Wpisz je w polu &quot;Sekret webhooka&quot; w tym panelu i zapisz.</p>
          </div>
        ),
      },
      {
        title: "2. Dodaj Webhook w WooCommerce",
        content: (
          <div className="space-y-2">
            <p>
              Zaloguj się do WordPressa swojego sklepu.
            </p>
            <p>
              Idź do: <strong>WooCommerce</strong> &gt; <strong>Ustawienia</strong>{" "}
              &gt; <strong>Zaawansowane</strong> &gt; <strong>Webhooki</strong>.
            </p>
            <p>Kliknij &quot;Dodaj webhook&quot;.</p>
          </div>
        ),
      },
      {
        title: "3. Skonfiguruj Webhook",
        content: (
          <div className="space-y-2">
            <ul className="list-disc pl-4 space-y-1 text-sm">
              <li>
                <strong>Nazwa:</strong> Panel Firmy (dowolna)
              </li>
              <li>
                <strong>Status:</strong> Aktywny
              </li>
              <li>
                <strong>Temat:</strong> Zamówienie utworzone (Order created)
              </li>
              <li>
                <strong>Adres URL dostarczania:</strong>{" "}
                <code className="bg-muted px-1 rounded">
                  https://twoja-domena.pl/api/woocommerce/webhook
                </code>
              </li>
              <li>
                <strong>Sekret:</strong> Wklej ten sam sekret co w punkcie 1.
              </li>
              <li>
                <strong>Wersja API:</strong> WP REST API Integration v3
              </li>
            </ul>
          </div>
        ),
      },
    ],
  },
};

export function ConfigurationGuide({ type }: { type: GuideType }) {
  const guide = guides[type];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Instrukcja konfiguracji</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{guide.title}</SheetTitle>
          <SheetDescription>{guide.description}</SheetDescription>
        </SheetHeader>
        <Separator className="my-6" />
        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          <div className="space-y-8 pb-8">
            {guide.steps.map((step, index) => (
              <div key={index} className="space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  {step.title}
                </h3>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {step.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
