'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction, type LoginFormState } from '../actions';

const initialState: LoginFormState = {};

function SubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" className="w-full" disabled={pending}>
			{pending ? 'Logowanie...' : 'Zaloguj się'}
		</Button>
	);
}

export function LoginForm() {
	const [state, formAction] = useActionState(loginAction, initialState);

	return (
		<form action={formAction} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="email">E-mail</Label>
				<Input id="email" name="email" type="email" autoComplete="email" required />
			</div>
			<div className="space-y-2">
				<Label htmlFor="password">Hasło</Label>
				<Input id="password" name="password" type="password" autoComplete="current-password" required />
			</div>
			{state?.errors ? (
				<p className="text-sm text-destructive">{state.errors}</p>
			) : null}
			<SubmitButton />
			<p className="text-sm text-muted-foreground">
				Nie masz konta?{' '}
				<Link href="/register" className="text-primary underline underline-offset-4">
					Zarejestruj się
				</Link>
			</p>
		</form>
	);
}
