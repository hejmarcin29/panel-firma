import { ProductForm } from "../_components/product-form";
import { getAttributes } from "../../attributes/actions";

export default async function NewProductPage() {
    const attributes = await getAttributes();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-medium">Nowy Produkt</h2>
                <p className="text-sm text-muted-foreground">
                    Dodaj nowy produkt lub usługę do kartoteki.
                </p>
            </div>
            <ProductForm availableAttributes={attributes} />
        </div>
    );
}
