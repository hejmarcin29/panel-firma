'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { issueProformaInvoice } from '../actions';

type IssueProformaButtonProps = {
	orderId: string;
	isWfirmaConfigured: boolean;
	disabled?: boolean;
	className?: string;
};

export function IssueProformaButton({
	orderId,
	isWfirmaConfigured,
	disabled = false,
	className,
}: IssueProformaButtonProps) {
	const router = useRouter();
	const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleClick = () => {
		if (disabled || !isWfirmaConfigured || isPending) {
			return;
		}

		setFeedback(null);

		startTransition(async () => {
			try {
				await issueProformaInvoice(orderId);
				setFeedback({ type: 'success', text: 'Proforma została wystawiona poprawnie.' });
				router.refresh();
			} catch (error) {
				const text =
					error instanceof Error ? error.message : 'Nie udało się wystawić proformy.';
				setFeedback({ type: 'error', text });
			}
		});
	};

	return (
		<div className={cn('flex flex-col gap-2', className)}>
			<Button onClick={handleClick} disabled={disabled || !isWfirmaConfigured || isPending}>
				{isPending ? 'Wystawianie...' : 'Wystaw proformę'}
			</Button>
			{!isWfirmaConfigured ? (
				<p className="text-xs text-muted-foreground">
					Uzupełnij ustawienia wFirma (login, klucz API, tenant), aby wystawiać dokumenty.
				</p>
			) : null}
			{feedback ? (
				<p className={`text-xs ${feedback.type === 'success' ? 'text-emerald-600' : 'text-destructive'}`}>
					{feedback.text}
				</p>
			) : null}
		</div>
	);
}
