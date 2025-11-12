'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, CircleDot } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { updateManualOrderStatus } from '../actions';
import type { OrderTimelineEntry } from '../data';

type OrderStatusTimelineProps = {
	orderId: string;
	entries: OrderTimelineEntry[];
	currentStatus: string;
};

type Feedback = { type: 'success'; message: string } | { type: 'error'; message: string } | null;

const iconByState = {
	completed: CheckCircle2,
	current: CircleDot,
	pending: Circle,
} as const;

const badgeVariantByState: Record<OrderTimelineEntry['state'], 'default' | 'secondary' | 'outline'> = {
	completed: 'secondary',
	current: 'default',
	pending: 'outline',
};

const stateLabel: Record<OrderTimelineEntry['state'], string> = {
	completed: 'Zrealizowane',
	current: 'W toku',
	pending: 'Oczekuje',
};

export function OrderStatusTimeline({ orderId, entries, currentStatus }: OrderStatusTimelineProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [feedback, setFeedback] = useState<Feedback>(null);

	const handleStatusChange = (nextStatus: string | null) => {
		if (!nextStatus || nextStatus === currentStatus) {
			return;
		}

		setFeedback(null);

		startTransition(async () => {
			try {
				await updateManualOrderStatus(orderId, nextStatus);
				setFeedback({ type: 'success', message: `Status zmieniony na „${nextStatus}”.` });
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: 'Nie udało się zaktualizować statusu.';
				setFeedback({ type: 'error', message });
			}
		});
	};

	return (
		<div className="space-y-4">
			<ol className="space-y-5">
				{entries.map((entry) => {
					const Icon = iconByState[entry.state] ?? Circle;
					const isActionable = Boolean(entry.statusKey);
					const isCurrent = entry.statusKey === currentStatus;

					const content = (
						<div
							className={cn(
								'flex flex-col gap-2 rounded-lg border px-4 py-3 text-left transition-colors',
								{
									'cursor-pointer hover:border-primary hover:bg-primary/5 focus-visible:border-primary focus-visible:outline-none':
										isActionable,
									'border-primary bg-primary/5': isCurrent,
								},
							)}
						>
							<div className="flex flex-wrap items-center gap-3">
								<span
									className={cn(
										'flex size-7 items-center justify-center rounded-full border',
										{
											'border-emerald-500 text-emerald-500': entry.state === 'completed',
											'border-primary text-primary': entry.state === 'current',
											'border-muted text-muted-foreground': entry.state === 'pending',
										},
									)}
								>
									<Icon className="h-3.5 w-3.5" />
								</span>
								<div className="space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="text-sm font-medium text-foreground">{entry.title}</p>
										<Badge variant={badgeVariantByState[entry.state]}>{stateLabel[entry.state]}</Badge>
									</div>
									<p className="text-sm text-muted-foreground">{entry.description}</p>
									<p className="text-xs text-muted-foreground">
										{entry.timestamp ? new Date(entry.timestamp).toLocaleString('pl-PL') : 'Oczekuje na aktualizację'}
									</p>
								</div>
							</div>
							{entry.tasks.length > 0 ? (
								<ul className="mt-2 space-y-1 text-xs">
									{entry.tasks.map((task) => (
										<li key={task.id} className="flex items-center gap-2 text-muted-foreground">
											<input type="checkbox" readOnly checked={task.completed} className="h-3.5 w-3.5 rounded border-muted-foreground text-primary focus-visible:outline-none" />
											<span>{task.label}</span>
										</li>
									))}
								</ul>
							) : null}
						</div>
					);

					return (
						<li key={entry.id}>
							{isActionable ? (
								<Button
									type="button"
									variant="ghost"
									className="w-full justify-start p-0 h-auto items-stretch"
									onClick={() => handleStatusChange(entry.statusKey)}
									disabled={isPending}
								>
									{content}
								</Button>
							) : (
								<div>{content}</div>
							)}
						</li>
					);
				})}
			</ol>
			{feedback ? (
				<p className={cn('text-xs', feedback.type === 'success' ? 'text-emerald-600' : 'text-destructive')}>
					{feedback.message}
				</p>
			) : null}
		</div>
	);
}
