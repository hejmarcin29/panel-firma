import { NextResponse } from "next/server";
import { getProjectSettings, updateProjectSettings } from "@/app/actions/project-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getProjectSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const res = await updateProjectSettings(body);
    if (!res.ok) return NextResponse.json(res, { status: 400 });
    const settings = await getProjectSettings();
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Błąd" }, { status: 400 });
  }
}
