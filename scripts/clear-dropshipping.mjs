import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({ url: "file:./data/panel.db" });

  try {
    await client.execute("DELETE FROM dropshipping_checklist_items");
    await client.execute("DELETE FROM dropshipping_orders");
    console.log("Wyczyszczono dane dropshipping.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
