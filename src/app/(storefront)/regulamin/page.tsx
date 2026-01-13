import Link from "next/link";

export default function RegulaminPage() {
  return (
    <div className="container px-4 md:px-6 py-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 font-playfair">Regulamin Strony</h1>

      <div className="prose prose-zinc max-w-none space-y-8">
        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">1. Postanowienia ogólne</h3>
          <div className="text-gray-600 space-y-2">
            <p>
              1.1. Sklep internetowy Primepodloga.pl prowadzony jest przez firmę:
              <br />
              <strong>Primepodloga.pl Marcin Przybyła</strong>
              <br />
              NIP: 6392026404
              <br />
              E-mail: <a href="mailto:kontakt@primepodloga.pl" className="text-emerald-600 hover:underline">kontakt@primepodloga.pl</a>
              <br />
              Telefon: <a href="tel:791303192" className="text-emerald-600 hover:underline">791 303 192</a>
            </p>
            <p>1.2. Regulamin określa zasady korzystania ze sklepu internetowego, składania zamówień, płatności, dostawy, zwrotów i reklamacji.</p>
            <p>1.3. Korzystanie ze sklepu oznacza akceptację regulaminu.</p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">2. Składanie zamówień i realizacja</h3>
          <div className="text-gray-600 space-y-2">
            <p>2.1. Klient może zapoznać się z ofertą i zamówić darmowe próbki paneli.</p>
            <p>2.2. Po otrzymaniu próbek klient może wyrazić zainteresowanie i:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>a) Zakup towaru bez usługi montażu:</strong> Klient składa zamówienie w sklepie internetowym, dokonuje płatności i otrzymuje produkt kurierem.
              </li>
              <li>
                <strong>b) Zakup towaru z usługą montażu:</strong> Ustalany jest termin montażu, wysyłana jest umowa do podpisania, klient wpłaca pierwszą transzę, następnie realizowany jest montaż, klient podpisuje protokół odbioru i wpłaca drugą transzę.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">3. Metody płatności</h3>
          <div className="text-gray-600 space-y-2">
            <p>3.1. Dostępne metody płatności:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Przelew bankowy</li>
              <li>BLIK</li>
              <li>Płatności online (Tpay)</li>
            </ul>
            <p>3.2. W przypadku montażu pierwsza transza jest wpłacana przed realizacją usługi, druga po zakończeniu prac.</p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">4. Dostawa i czas realizacji</h3>
          <div className="text-gray-600 space-y-2">
            <p>4.1. W przypadku zamówień bez montażu dostawa realizowana jest przez firmę kurierską, koszty pokrywa sprzedawca.</p>
            <p>4.2. W przypadku zamówień z montażem, sprzedawca odpowiada za dostawę i montaż, a termin ustalany jest indywidualnie z klientem.</p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">5. Prawo do odstąpienia od umowy</h3>
          <div className="text-gray-600 space-y-2">
            <p>5.1. Klient, który zakupił produkt bez montażu, ma prawo do odstąpienia od umowy w ciągu 14 dni od otrzymania towaru.</p>
            <p>5.2. W celu zwrotu klient powinien skontaktować się mailowo na <a href="mailto:kontakt@primepodloga.pl" className="text-emerald-600 hover:underline">kontakt@primepodloga.pl</a> lub telefonicznie pod nr <a href="tel:791303192" className="text-emerald-600 hover:underline">791 303 192</a>.</p>
            <p>5.3. Koszt zwrotu produktu ponosi klient.</p>
            <p>5.4. Prawo odstąpienia od umowy nie przysługuje w przypadku montażu, gdyż usługa jest realizowana na indywidualne zamówienie klienta.</p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">6. Reklamacje i gwarancja</h3>
          <div className="text-gray-600 space-y-2">
            <p>6.1. Reklamacje dotyczące produktu lub montażu można zgłosić poprzez e-mail lub telefon.</p>
            <p>6.2. Reklamacje rozpatrywane są w ciągu 14 dni roboczych od ich otrzymania.</p>
            <p>6.3. W przypadku uznania reklamacji sprzedawca może dokonać naprawy, wymiany produktu lub zwrotu pieniędzy.</p>
            <p>6.4. Reklamacja w przypadku montażu jest możliwa wyłącznie, jeśli jakość montażu i paneli jest niezgodna z warunkami określonymi w umowie.</p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">7. Ochrona danych osobowych</h3>
          <div className="text-gray-600 space-y-2">
            <p>7.1. Zasady przetwarzania danych osobowych określa Polityka Prywatności, dostępna pod adresem: <Link href="/polityka-prywatnosci" className="text-emerald-600 hover:underline">Polityka Prywatności</Link></p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">8. Prawa autorskie i korzystanie z treści strony</h3>
          <div className="text-gray-600 space-y-2">
            <p>8.1. Wszystkie materiały, teksty, grafiki i zdjęcia zamieszczone na stronie primepodloga.pl są własnością sprzedawcy i podlegają ochronie prawnej.</p>
            <p>8.2. Zabrania się kopiowania, udostępniania i wykorzystywania treści bez zgody administratora strony.</p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">9. Zmiany w regulaminie i prawo właściwe</h3>
          <div className="text-gray-600 space-y-2">
            <p>9.1. Administrator zastrzega sobie prawo do wprowadzania zmian w regulaminie.</p>
            <p>9.2. Wszelkie zmiany wchodzą w życie w terminie wskazanym na stronie internetowej.</p>
            <p>9.3. W sprawach nieuregulowanych w regulaminie obowiązują przepisy prawa polskiego.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
