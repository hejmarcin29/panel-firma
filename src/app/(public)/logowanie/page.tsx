import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export default function LogowaniePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md rounded-3xl border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">Zaloguj się do panelu</CardTitle>
          <CardDescription>
            Wpisz dane konta, aby zarządzać montażami i zamówieniami dropshipping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
