import { CheckoutForm } from "./_components/checkout-form";

export default function CheckoutPage() {
  return (
    <div className="container min-h-screen py-10 space-y-8">
       <div className="space-y-2">
           <h1 className="text-3xl font-bold font-playfair">Finalizacja Zamówienia</h1>
           <p className="text-muted-foreground">
               Uzupełnij dane dostawy i wybierz metodę płatności.
           </p>
       </div>
       
       <CheckoutForm />
    </div>
  );
}
