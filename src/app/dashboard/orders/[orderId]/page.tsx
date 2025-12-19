import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';

import { getManualOrderById, getOrderDocuments } from '../actions';
import type { Order, OrderTimelineEntry, OrderDocument, OrderTaskOverrides } from '../data';
import { statusOptions } from '../utils';
import { OrderDetailsView } from '../_components/details/order-details-view';
import { Metadata } from 'next';

type OrderDetailsPageParams = {
	params: Promise<{
		orderId: string;
	}>;
};

export async function generateMetadata(
    { params }: OrderDetailsPageParams
): Promise<Metadata> {
    const { orderId } = await params;
    const order = await getManualOrderById(orderId);
    
    return {
        title: order ? `Zamówienie ${order.reference}` : 'Szczegóły zamówienia',
    };
}

const statusIndexMap = statusOptions.reduce<Record<string, number>>((acc, status, index) => {
	acc[status] = index;
	return acc;
}, {});

function enhanceTimelineEntries(
	entries: OrderTimelineEntry[],
	documents: OrderDocument[],
	currentStatus: string,
	taskOverrides: OrderTaskOverrides,
): OrderTimelineEntry[] {
	const currentStageIndex = statusIndexMap[currentStatus] ?? 0;

	return entries.map((entry) => {
		if (!entry.statusKey) {
			return entry;
		}

		const enhancedTasks = entry.tasks.map((task) => {
			const autoCompleted = computeTaskCompletion(
				entry.statusKey as string,
				task.label,
				entry.state,
				documents,
				currentStageIndex,
			);
			const hasManualOverride = Object.prototype.hasOwnProperty.call(taskOverrides, task.id);
			const manualOverride = hasManualOverride ? taskOverrides[task.id] : null;
			const completed = hasManualOverride ? (manualOverride as boolean) : autoCompleted;
			const completionSource: 'auto' | 'manual' = hasManualOverride ? 'manual' : 'auto';

			return {
				...task,
				completed,
				autoCompleted,
				manualOverride: hasManualOverride ? (manualOverride as boolean) : null,
				completionSource,
			};
		});

		return {
			...entry,
			tasks: enhancedTasks,
		};
	});
}

function computeTaskCompletion(
	statusKey: string,
	taskLabel: string,
	state: OrderTimelineEntry['state'],
	documents: OrderDocument[],
	currentStageIndex: number,
): boolean {
	const normalizedStatus = statusKey.toLowerCase();
	const normalizedTask = taskLabel.toLowerCase();

	const hasDocument = (type: string) =>
		documents.some((document) => document.type === type && document.status !== 'cancelled');

	const hasDocumentPdf = (type: string) =>
		documents.some((document) => document.type === type && Boolean(document.pdfUrl));

	if (normalizedStatus === 'weryfikacja i płatność') {
		if (
			normalizedTask.includes('proforma') &&
			normalizedTask.includes('wystaw') &&
			normalizedTask.includes('wysł')
		) {
			return hasDocument('proforma') && hasDocumentPdf('proforma');
		}
		if (normalizedTask.includes('proforma') && normalizedTask.includes('opłac')) {
			return state === 'completed';
		}
	}

	if (normalizedStatus === 'kompletacja zamówienia') {
		if (normalizedTask.includes('wysłane')) {
			const shippingStageIndex = statusIndexMap['Wydanie przewoźnikowi'];
			return typeof shippingStageIndex === 'number' ? currentStageIndex >= shippingStageIndex : state === 'completed';
		}
	}

	if (normalizedStatus === 'dostarczone do klienta') {
		if (normalizedTask.includes('faktur') && normalizedTask.includes('końcową')) {
			return hasDocument('final_invoice');
		}
	}

	return state === 'completed';
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageParams) {
	const { orderId } = await params;

	await requireUser();

	const orderData = await getManualOrderById(orderId);

	if (!orderData) {
		notFound();
	}

	const order: Order = orderData;
	const documents = await getOrderDocuments(order.id);
	
	const statusesWithTasks = enhanceTimelineEntries(
		order.statuses,
		documents,
		order.status,
		order.taskOverrides ?? {},
	);

	return (
		<OrderDetailsView 
            order={order} 
            documents={documents} 
            timelineEntries={statusesWithTasks} 
        />
	);
}
