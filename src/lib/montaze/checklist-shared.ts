export type MontageChecklistTemplate = {
	id: string;
	label: string;
	allowAttachment: boolean;
    associatedStage?: string;
};

export const DEFAULT_MONTAGE_CHECKLIST: readonly MontageChecklistTemplate[] = [
	{
		id: 'contract_signed_check',
		label: 'Podpisano umowę/cenę',
		allowAttachment: false,
        associatedStage: 'before_first_payment',
	},
	{
		id: 'advance_invoice_issued',
		label: 'Wystawiono FV zaliczkową',
		allowAttachment: false,
        associatedStage: 'before_first_payment',
	},
	{
		id: 'advance_invoice_paid',
		label: 'Zapłacono FV zaliczkową',
		allowAttachment: false,
        associatedStage: 'before_first_payment',
	},
	{
		id: 'protocol_signed',
		label: 'Podpisano protokół odbioru',
		allowAttachment: true,
        associatedStage: 'before_final_invoice',
	},
	{
		id: 'final_invoice_issued',
		label: 'Wystawiono FV końcową',
		allowAttachment: false,
        associatedStage: 'before_final_invoice',
	},
	{
		id: 'final_invoice_paid',
		label: 'Zapłacono FV końcową',
		allowAttachment: false,
        associatedStage: 'before_final_invoice',
	},
] as const;
