'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { testR2Connection, updateR2Config } from '../actions';

type Props = {
initialAccountId: string;
initialAccessKeyId: string;
initialSecretAccessKey: string;
initialBucketName: string;
initialEndpoint: string;
initialPublicBaseUrl: string;
initialApiToken: string;
};

export function R2ConfigForm({
initialAccountId,
initialAccessKeyId,
initialSecretAccessKey,
initialBucketName,
initialEndpoint,
initialPublicBaseUrl,
initialApiToken,
}: Props) {
const router = useRouter();
const [formData, setFormData] = useState({
accountId: initialAccountId,
accessKeyId: initialAccessKeyId,
secretAccessKey: initialSecretAccessKey,
bucketName: initialBucketName,
endpoint: initialEndpoint,
publicBaseUrl: initialPublicBaseUrl,
apiToken: initialApiToken,
});

const [isSaving, setIsSaving] = useState(false);
const [isTesting, setIsTesting] = useState(false);

const debouncedSave = useDebouncedCallback(async (data: typeof formData) => {
setIsSaving(true);
try {
await updateR2Config(data);
router.refresh();
} catch (_) {
toast.error('Błąd zapisu konfiguracji R2');
} finally {
setIsSaving(false);
}
}, 1000);

const handleChange = (field: keyof typeof formData, value: string) => {
const newData = { ...formData, [field]: value };
setFormData(newData);
debouncedSave(newData);
};

const handleTestConnection = async () => {
setIsTesting(true);
try {
const result = await testR2Connection();
if (result.success) {
toast.success(result.message);
} else {
toast.error(result.message);
}
} catch {
toast.error('Wystąpił błąd podczas testowania połączenia.');
} finally {
setIsTesting(false);
}
};

return (
<div className='space-y-4'>
<div className='flex items-center justify-between mb-4'>
<div className='flex items-center gap-2'>
{isSaving ? (
<span className='text-xs text-muted-foreground flex items-center gap-1'>
<Loader2 className='w-3 h-3 animate-spin' />
Zapisywanie...
</span>
) : (
<span className='text-xs text-emerald-600 flex items-center gap-1 opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100' data-visible={!isSaving}>
<Check className='w-3 h-3' />
Zapisano
</span>
)}
</div>
</div>

<div className='grid gap-4'>
<div className='grid gap-2'>
<Label htmlFor='r2-account-id'>Account ID</Label>
<Input
id='r2-account-id'
value={formData.accountId}
onChange={(e) => handleChange('accountId', e.target.value)}
placeholder='np. 8f9e...'
/>
</div>

<div className='grid gap-2'>
<Label htmlFor='r2-access-key-id'>Access Key ID</Label>
<Input
id='r2-access-key-id'
value={formData.accessKeyId}
onChange={(e) => handleChange('accessKeyId', e.target.value)}
placeholder='np. 04d2...'
/>
</div>

<div className='grid gap-2'>
<Label htmlFor='r2-secret-access-key'>Secret Access Key</Label>
<Input
id='r2-secret-access-key'
type='password'
value={formData.secretAccessKey}
onChange={(e) => handleChange('secretAccessKey', e.target.value)}
placeholder='••••••••'
/>
</div>

<div className='grid gap-2'>
<Label htmlFor='r2-bucket-name'>Bucket Name</Label>
<Input
id='r2-bucket-name'
value={formData.bucketName}
onChange={(e) => handleChange('bucketName', e.target.value)}
placeholder='np. my-bucket'
/>
</div>

<div className='grid gap-2'>
<Label htmlFor='r2-endpoint'>Endpoint (S3 API)</Label>
<Input
id='r2-endpoint'
value={formData.endpoint}
onChange={(e) => handleChange('endpoint', e.target.value)}
placeholder='https://<accountid>.r2.cloudflarestorage.com'
/>
</div>

<div className='grid gap-2'>
<Label htmlFor='r2-public-base-url'>Public Base URL (Custom Domain)</Label>
<Input
id='r2-public-base-url'
value={formData.publicBaseUrl}
onChange={(e) => handleChange('publicBaseUrl', e.target.value)}
placeholder='https://cdn.example.com'
/>
</div>

<div className='grid gap-2'>
<Label htmlFor='r2-api-token'>API Token (Read/Write)</Label>
<Input
id='r2-api-token'
type='password'
value={formData.apiToken}
onChange={(e) => handleChange('apiToken', e.target.value)}
placeholder='••••••••'
/>
<p className='text-xs text-muted-foreground'>
Token API z uprawnieniami Admin Read & Write (potrzebny do presigned URLs).
</p>
</div>
</div>

<div className='flex justify-end pt-4'>
<Button
type='button'
variant='outline'
onClick={handleTestConnection}
disabled={isTesting}
>
{isTesting ? 'Testowanie...' : 'Testuj połączenie'}
</Button>
</div>
</div>
);
}
