'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerAction, type RegisterFormState } from '../actions';

const initialState: RegisterFormState = {};

function SubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" className="w-full" disabled={pending}>
			{pending ? 'Zakładanie konta...' : 'Utwórz konto'}
		</Button>
	);
}

export function RegisterForm() {
	const [state, formAction] = useActionState(registerAction, initialState);

	return (
		<form action={formAction} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="name">Imię i nazwisko</Label>
				<Input id="name" name="name" autoComplete="name" required />
			</div>
			<div className="space-y-2">
				<Label htmlFor="email">E-mail</Label>
				<Input id="email" name="email" type="email" autoComplete="email" required />
			</div>
			<div className="space-y-2">
				<Label htmlFor="password">Hasło</Label>
				<Input id="password" name="password" type="password" autoComplete="new-password" required />
			</div>
			<div className="space-y-2">
				<Label htmlFor="confirmPassword">Powtórz hasło</Label>
				<Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
			</div>
			{state?.errors ? (
				<p className="text-sm text-destructive">{state.errors}</p>
			) : null}
			<SubmitButton />
			<p className="text-sm text-muted-foreground">
				Masz już konto?{' '}
				<Link href="/login" className="text-primary underline underline-offset-4">
					Zaloguj się
				</Link>
			</p>
		</form>
	);
}
