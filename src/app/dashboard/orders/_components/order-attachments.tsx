"use client";

import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, PaperclipIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { slugify } from "@/lib/strings";

import { addOrderAttachment } from "../actions";
import type { OrderAttachment } from "../data";

type OrderAttachmentsProps = {
	orderId: string;
	customerName: string;
	attachments: OrderAttachment[];
};

function formatTimestamp(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "brak daty";
	}

	return new Intl.DateTimeFormat("pl-PL", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
}

function attachmentDisplayName(attachment: OrderAttachment) {
	if (attachment.title) {
		return attachment.title;
	}

	const clean = attachment.url.split("?")[0] ?? attachment.url;
	const segments = clean.split("/");
	return segments[segments.length - 1] ?? clean;
}

export function OrderAttachments({ orderId, customerName, attachments }: OrderAttachmentsProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState("");
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const folderSegment = useMemo(() => slugify(customerName || "klient") || "klient", [customerName]);
	const targetFolder = useMemo(() => `zamowienia/${folderSegment}/dokumenty`, [folderSegment]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		const formData = new FormData(form);
		formData.set("orderId", orderId);

		startTransition(async () => {
			setError(null);
			try {
				await addOrderAttachment(formData);
				setTitle("");
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
				form.reset();
				router.refresh();
			} catch (err) {
				const message = err instanceof Error ? err.message : "Nie udało się dodać załącznika.";
				setError(message);
			}
		});
	};

	return (
		<div className="space-y-3">
			<div className="space-y-1">
				<h3 className="text-sm font-semibold text-foreground">Dodatkowe załączniki</h3>
				<p className="text-xs text-muted-foreground">
					Przechowuj umowy, potwierdzenia lub notatki powiązane z zamówieniem.
				</p>
			</div>

			{attachments.length === 0 ? (
				<p className="text-xs text-muted-foreground">Brak dodanych plików.</p>
			) : (
				<ul className="space-y-2.5">
					{attachments.map((attachment) => (
						<li key={attachment.id} className="rounded-lg border border-border/60 bg-muted/15 px-3.5 py-2.5">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div className="flex items-center gap-2 text-xs font-medium text-foreground">
									<PaperclipIcon className="size-4 text-muted-foreground" />
									<span className="line-clamp-1">{attachmentDisplayName(attachment)}</span>
								</div>
								<Button asChild variant="outline" size="sm" className="h-7 px-2.5 text-[11px]">
									<Link href={attachment.url} target="_blank" rel="noreferrer">
										<Download className="mr-1 size-3.5" />
										Pobierz
									</Link>
								</Button>
							</div>
							<div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
								<Badge variant="outline" className="px-2 py-0 text-[10px] uppercase tracking-wide">
									{formatTimestamp(attachment.createdAt)}
								</Badge>
								{attachment.uploader ? (
									<span>
										Dodane przez {attachment.uploader.name ?? attachment.uploader.email}
									</span>
								) : null}
							</div>
						</li>
					))}
				</ul>
			)}

			<Separator className="my-3" />

			<form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-2.5">
				<input type="hidden" name="orderId" value={orderId} />
				<div className="space-y-1">
					<Label htmlFor="order-attachment-file" className="text-xs font-semibold uppercase text-muted-foreground">
						Nowy plik
					</Label>
					<Input
						type="file"
						id="order-attachment-file"
						name="file"
						ref={fileInputRef}
						required
						disabled={isPending}
					/>
				</div>
				<Input
					name="title"
					placeholder="Opis pliku (opcjonalnie)"
					value={title}
					onChange={(event) => setTitle(event.target.value)}
					disabled={isPending}
				/>
				<div className="flex items-center justify-end gap-2">
					{error ? <span className="text-xs text-destructive">{error}</span> : null}
					<Button type="submit" size="sm" disabled={isPending} className="px-3 text-xs">
						{isPending ? "Dodawanie..." : "Dodaj załącznik"}
					</Button>
				</div>
			</form>

			<p className="text-[11px] text-muted-foreground">
				Pliki trafiają do katalogu R2: <span className="font-medium text-foreground">{targetFolder}</span>.
			</p>
		</div>
	);
}
