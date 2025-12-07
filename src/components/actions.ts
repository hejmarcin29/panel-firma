"use server";

import { cookies } from "next/headers";

export async function setDensityCookie(density: "comfortable" | "compact") {
  const cookieStore = await cookies();
  cookieStore.set("density", density, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}
