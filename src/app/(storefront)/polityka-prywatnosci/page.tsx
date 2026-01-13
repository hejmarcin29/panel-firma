import Link from "next/link";

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="container px-4 md:px-6 py-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 font-playfair">Polityka Prywatności</h1>

      <div className="prose prose-zinc max-w-none space-y-8">
        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">1. Administrator danych osobowych</h3>
          <div className="text-gray-600 space-y-2">
            <p>
              Administratorem danych osobowych jest:
              <br />
              <strong>Primepodloga.pl Marcin Przybyła</strong>
              <br />
              NIP: 6392026404
              <br />
              E-mail: <a href="mailto:kontakt@primepodloga.pl" className="text-emerald-600 hover:underline">kontakt@primepodloga.pl</a>
              <br />
              Telefon: <a href="tel:791303192" className="text-emerald-600 hover:underline">791 303 192</a>
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">2. Zakres zbieranych danych</h3>
          <div className="text-gray-600 space-y-2">
            <p>Zbieramy następujące dane osobowe:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Imię i nazwisko</li>
              <li>Adres</li>
              <li>Numer telefonu</li>
              <li>Adres e-mail</li>
              <li>Dane analityczne (Google Analytics, Meta Pixel)</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">3. Cel przetwarzania danych</h3>
          <div className="text-gray-600 space-y-2">
            <p>Dane osobowe są przetwarzane w następujących celach:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Realizacja zamówień i kontakt z klientem</li>
              <li>Obsługa płatności i dostawy</li>
              <li>Marketing i remarketing (Google Analytics, Meta Pixel)</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">4. Podstawa prawna przetwarzania danych</h3>
          <div className="text-gray-600 space-y-2">
            <p>Przetwarzanie danych odbywa się na podstawie:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Niezbędności do wykonania umowy (np. realizacja zamówienia)</li>
              <li>Uzasadnionego interesu administratora (marketing, analityka)</li>
              <li>Obowiązków prawnych (np. przechowywanie dokumentacji księgowej)</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">5. Odbiorcy danych</h3>
          <div className="text-gray-600 space-y-2">
            <p>Dane osobowe mogą być przekazywane:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Firmom kurierskim – w celu dostarczenia zamówienia</li>
              <li>Podmiotom obsługującym księgowość i płatności</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">6. Okres przechowywania danych</h3>
          <div className="text-gray-600 space-y-2">
            <p>Dane są przechowywane maksymalnie 5 lat od ich otrzymania, zgodnie z obowiązującymi przepisami prawa.</p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">7. Prawa użytkownika</h3>
          <div className="text-gray-600 space-y-2">
            <p>Każdy użytkownik ma prawo do:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dostępu do swoich danych</li>
              <li>Sprostowania danych</li>
              <li>Żądania usunięcia danych</li>
              <li>Ograniczenia przetwarzania</li>
              <li>Sprzeciwu wobec przetwarzania danych</li>
            </ul>
            <p>W celu realizacji tych praw można skontaktować się poprzez e-mail: <a href="mailto:kontakt@primepodloga.pl" className="text-emerald-600 hover:underline">kontakt@primepodloga.pl</a></p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">8. Pliki cookies i narzędzia analityczne</h3>
          <div className="text-gray-600 space-y-2">
            <p>Nasza strona wykorzystuje pliki cookies oraz narzędzia analityczne, takie jak:</p>
            <ul className="list-disc pl-5 space-y-1">
               <li>Google Analytics – do analizy ruchu na stronie i poprawy jakości usług</li>
               <li>Meta Pixel – do prowadzenia kampanii reklamowych i remarketingu</li>
            </ul>
            <p className="mt-2"><strong>Czym są pliki cookies?</strong><br/>
            Cookies to małe pliki tekstowe przechowywane na urządzeniu użytkownika. Służą do:</p>
            <ul className="list-disc pl-5 space-y-1">
               <li>Zapewnienia prawidłowego działania strony</li>
               <li>Analizowania zachowania użytkowników na stronie</li>
               <li>Wyświetlania dopasowanych reklam</li>
            </ul>
             <p className="mt-2"><strong>Jak zarządzać plikami cookies?</strong><br/>
             Użytkownik może samodzielnie zarządzać plikami cookies poprzez ustawienia swojej przeglądarki. Możliwe jest m.in.:</p>
             <ul className="list-disc pl-5 space-y-1">
                <li>Usunięcie zapisanych plików cookies</li>
                <li>Blokowanie automatycznego zapisywania plików cookies</li>
                <li>Otrzymywanie powiadomień o ich zapisywaniu</li>
             </ul>
             <p>Brak zgody na cookies może wpłynąć na funkcjonalność strony.</p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">9. Kontakt i skargi</h3>
          <div className="text-gray-600 space-y-2">
            <p>W razie pytań dotyczących przetwarzania danych osobowych można skontaktować się:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>E-mail: <a href="mailto:kontakt@primepodloga.pl" className="text-emerald-600 hover:underline">kontakt@primepodloga.pl</a></li>
              <li>Telefon: <a href="tel:791303192" className="text-emerald-600 hover:underline">791 303 192</a></li>
            </ul>
            <p className="mt-4">
              Użytkownik ma również prawo do wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO), jeśli uzna, że jego dane są przetwarzane niezgodnie z prawem.
            </p>
            <p className="mt-2"><strong>Dane kontaktowe UODO:</strong></p>
            <address className="not-italic">
              ul. Stawki 2, 00-193 Warszawa<br />
              Telefon: 22 531 03 00<br />
              E-mail: <a href="mailto:kancelaria@uodo.gov.pl" className="text-emerald-600 hover:underline">kancelaria@uodo.gov.pl</a>
            </address>
          </div>
        </section>
      </div>
    </div>
  );
}
