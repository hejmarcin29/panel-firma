'use client';

import { useRouter } from 'next/navigation';
import { ComposeForm, ComposeDefaults } from '../../_components/compose-form';
import type { MailAccountSummary } from '../../types';

interface MobileComposeWrapperProps {
    accounts: MailAccountSummary[];
    defaults?: ComposeDefaults;
}

export function MobileComposeWrapper({ accounts, defaults }: MobileComposeWrapperProps) {
    const router = useRouter();

    return (
        <ComposeForm 
            accounts={accounts} 
            defaults={defaults}
            onSuccess={() => {
                router.push('/dashboard/mail');
                router.refresh();
            }}
            onCancel={() => router.back()}
        />
    );
}
