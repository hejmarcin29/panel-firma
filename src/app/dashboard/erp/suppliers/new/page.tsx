import { SupplierForm } from "../_components/supplier-form";

export default function NewSupplierPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-medium">Nowy Dostawca</h2>
                <p className="text-sm text-muted-foreground">
                    Dodaj nowego dostawcę do bazy.
                </p>
            </div>
            <SupplierForm />
        </div>
    );
}
