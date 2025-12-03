'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { saveWooSettings } from '../actions';
import { Eye, EyeOff, Save } from 'lucide-react';

interface WooSettingsFormProps {
	initialSettings: {
		consumerKey: string;
		consumerSecret: string;
		webhookSecret: string;
		wooUrl: string;
	};
}

export function WooSettingsForm({ initialSettings }: WooSettingsFormProps) {
	const [isPending, startTransition] = useTransition();
	const [showSecrets, setShowSecrets] = useState(false);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		startTransition(async () => {
			await saveWooSettings(formData);
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Konfiguracja WooCommerce</CardTitle>
				<CardDescription>
					Wprowadź klucze API ze swojego sklepu WooCommerce, aby umożliwić synchronizację zamówień.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="wooUrl">Adres sklepu (URL)</Label>
						<Input
							id="wooUrl"
							name="wooUrl"
							placeholder="https://twoj-sklep.pl"
							defaultValue={initialSettings.wooUrl}
							required
						/>
					</div>
					
					<div className="space-y-2">
						<Label htmlFor="consumerKey">Consumer Key</Label>
						<div className="relative">
							<Input
								id="consumerKey"
								name="consumerKey"
								type={showSecrets ? 'text' : 'password'}
								placeholder="ck_..."
								defaultValue={initialSettings.consumerKey}
								required
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
								onClick={() => setShowSecrets(!showSecrets)}
							>
								{showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</Button>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="consumerSecret">Consumer Secret</Label>
						<div className="relative">
							<Input
								id="consumerSecret"
								name="consumerSecret"
								type={showSecrets ? 'text' : 'password'}
								placeholder="cs_..."
								defaultValue={initialSettings.consumerSecret}
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="webhookSecret">Webhook Secret</Label>
						<div className="relative">
							<Input
								id="webhookSecret"
								name="webhookSecret"
								type={showSecrets ? 'text' : 'password'}
								placeholder="Sekret webhooka..."
								defaultValue={initialSettings.webhookSecret}
								required
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							Ten sam sekret musi być ustawiony w WooCommerce przy konfiguracji Webhooka.
						</p>
					</div>

					<div className="flex justify-end">
						<Button type="submit" disabled={isPending}>
							{isPending ? 'Zapisywanie...' : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Zapisz ustawienia
                                </>
                            )}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
