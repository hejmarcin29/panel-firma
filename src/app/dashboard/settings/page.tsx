import { desc, eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    title: 'Ustawienia',
};

import { requireUser } from '@/lib/auth/session';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/lib/db';
import { integrationLogs, mailAccounts, manualOrders, systemLogs, users } from '@/lib/db/schema';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { getMontageChecklistTemplates } from '@/lib/montaze/checklist';
import { getMontageAutomationRules } from '@/lib/montaze/automation';
import { getMontageStatusDefinitions } from '@/lib/montaze/statuses';

import { R2ConfigForm } from './_components/r2-config-form';
import { MailSettingsForm } from './_components/mail-settings-form';
import { AutomationRegistry } from './_components/automation-registry';
import { SettingsView } from './_components/settings-view';
import { MobileMenuSettings } from './_components/mobile-menu-settings';
import { KpiSettingsForm } from './_components/kpi-settings-form';
import { ThemeSelector } from './_components/theme-selector';
import { DensitySelector } from './_components/density-selector';
import { MobileMenuItem } from './actions';
import { WooSettingsForm } from './integrations/_components/woo-settings-form';
import { GoogleCalendarSettingsForm } from './integrations/_components/google-calendar-settings-form';
import { FluentFormsSettings } from './integrations/_components/fluent-forms-settings';
import { getFluentFormsSecret } from './integrations/fluent-actions';
import { IntegrationLogs } from './integrations/_components/integration-logs';
import { WpChangesSettings } from './_components/wp-changes-settings';
import { DocumentationView } from './_components/documentation-view';
import { TrashView } from './_components/trash-view';
import { getDeletedQuotes, getDeletedCustomers, getDeletedMontages, getDeletedProducts } from './actions';

import { LogoSettings } from './_components/logo-settings';
import { CompanySettingsForm } from './_components/company-settings-form';
import { PortalSettingsForm } from './_components/portal-settings-form';
import { ContractTemplatesManager } from './_components/contract-templates-manager';
import { getContractTemplates } from './contracts/actions';
import { InstallerSettingsView } from './_components/installer-settings-view';

type LogLevel = 'info' | 'warning' | 'error';

type LogRow = {
	id: string;
	createdAt: number | null;
	level: LogLevel;
	message: string;
};

function formatTimestamp(value: number | Date | null | undefined) {
	if (!value) {
		return 'brak';
	}

	const timestamp = value instanceof Date ? value.getTime() : value;

	return new Intl.DateTimeFormat('pl-PL', {
		dateStyle: 'short',
		timeStyle: 'medium',
	}).format(new Date(timestamp));
}

function levelBadgeClass(level: LogLevel) {
	switch (level) {
		case 'info':
			return 'bg-emerald-100 text-emerald-900 border-transparent';
		case 'warning':
			return 'bg-amber-100 text-amber-900 border-transparent';
		case 'error':
		default:
			return 'border-transparent bg-destructive text-white';
	}
}

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  
  // Allow installers to access settings
  if (!sessionUser.roles.includes('admin') && !sessionUser.roles.includes('installer')) {
      redirect('/dashboard');
  }
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, sessionUser.id),
  });

  if (!user) {
      // Should not happen if session is valid
      return null;
  }

  // INSTALLER VIEW
  if (sessionUser.roles.includes('installer') && !sessionUser.roles.includes('admin')) {
      return <InstallerSettingsView user={user} />;
  }
  
  // Parsowanie konfiguracji menu mobilnego
  let mobileMenuConfig: MobileMenuItem[] = [];
  try {
    if (user.mobileMenuConfig) {
      // Drizzle with mode: 'json' returns object/array directly, no need to parse if typed correctly
      // But let's check if it's string or object just in case
      const parsed = typeof user.mobileMenuConfig === 'string' 
        ? JSON.parse(user.mobileMenuConfig) 
        : user.mobileMenuConfig;
      
      if (Array.isArray(parsed)) {
        mobileMenuConfig = parsed as MobileMenuItem[];
      }
    }
  } catch (e) {
    console.error("Failed to parse mobile menu config", e);
  }

  const headerList = await headers();
  const forwardedProto = headerList.get('x-forwarded-proto');
  const forwardedHost = headerList.get('x-forwarded-host');
  const hostHeader = headerList.get('host');

  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? null;
  const host = forwardedHost ?? hostHeader ?? configuredBaseUrl?.replace(/https?:\/\//, '') ?? 'localhost:3000';
  const protocol =
    forwardedProto ?? configuredBaseUrl?.split('://')[0] ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');

  const webhookBase = configuredBaseUrl ?? `${protocol}://${host}`;
  const webhookUrl = `${webhookBase.replace(/\/$/, '')}/api/woocommerce/webhook`;

	const [
		webhookSecretSetting,
		wooConsumerKeySetting,
		wooConsumerSecretSetting,
		wooUrlSetting,
		r2AccountIdSetting,
		r2AccessKeyIdSetting,
		r2SecretAccessKeySetting,
		r2BucketNameSetting,
		r2EndpointSetting,
		r2PublicBaseUrlSetting,
		r2ApiTokenSetting,
		montageChecklistTemplates,
		montageAutomationRules,
		montageStatusDefinitions,
        montageNotificationsJson,
		kpiMontageThreatDays,
		kpiOrderUrgentDays,
        kpiAlertMissingMaterialStatusDays,
        kpiAlertMissingInstallerStatusDays,
        kpiAlertMissingMeasurerDays,
        kpiAlertMissingInstallerDays,
        kpiAlertMaterialOrderedDays,
        kpiAlertMaterialInstockDays,
        kpiAlertLeadNoMeasurerDays,
        kpiAlertQuoteDelayDays,
        kpiAlertOfferStalledDays,
		googleCalendarId,
		googleClientEmail,
		googlePrivateKey,
        googleOAuthClientId,
        googleOAuthClientSecret,
        systemLogoUrl,
        deletedQuotes,
        deletedCustomers,
        deletedMontages,
        deletedProducts,
        companyName,
        companyAddress,
        companyNip,
        companyBankName,
        companyBankAccount,
        fluentFormsSecret,
        portalEnabled,
        smsProvider,
        smsToken,
        smsSenderName,
	] = await Promise.all([
		getAppSetting(appSettingKeys.wooWebhookSecret),
		getAppSetting(appSettingKeys.wooConsumerKey),
		getAppSetting(appSettingKeys.wooConsumerSecret),
		getAppSetting(appSettingKeys.wooUrl),
		getAppSetting(appSettingKeys.r2AccountId),
		getAppSetting(appSettingKeys.r2AccessKeyId),
		getAppSetting(appSettingKeys.r2SecretAccessKey),
		getAppSetting(appSettingKeys.r2BucketName),
		getAppSetting(appSettingKeys.r2Endpoint),
		getAppSetting(appSettingKeys.r2PublicBaseUrl),
		getAppSetting(appSettingKeys.r2ApiToken),
		getMontageChecklistTemplates(),
		getMontageAutomationRules(),
		getMontageStatusDefinitions(),
        getAppSetting(appSettingKeys.montageNotifications),
		getAppSetting(appSettingKeys.kpiMontageThreatDays),
		getAppSetting(appSettingKeys.kpiOrderUrgentDays),
        getAppSetting(appSettingKeys.kpiAlertMissingMaterialStatusDays),
        getAppSetting(appSettingKeys.kpiAlertMissingInstallerStatusDays),
        getAppSetting(appSettingKeys.kpiAlertMissingMeasurerDays),
        getAppSetting(appSettingKeys.kpiAlertMissingInstallerDays),
        getAppSetting(appSettingKeys.kpiAlertMaterialOrderedDays),
        getAppSetting(appSettingKeys.kpiAlertMaterialInstockDays),
        getAppSetting(appSettingKeys.kpiAlertLeadNoMeasurerDays),
        getAppSetting(appSettingKeys.kpiAlertQuoteDelayDays),
        getAppSetting(appSettingKeys.kpiAlertOfferStalledDays),
		getAppSetting(appSettingKeys.googleCalendarId),
		getAppSetting(appSettingKeys.googleClientEmail),
		getAppSetting(appSettingKeys.googlePrivateKey),
        getAppSetting(appSettingKeys.googleOAuthClientId),
        getAppSetting(appSettingKeys.googleOAuthClientSecret),
        getAppSetting(appSettingKeys.systemLogoUrl),
        getDeletedQuotes(),
        getDeletedCustomers(),
        getDeletedMontages(),
        getDeletedProducts(),
        getAppSetting(appSettingKeys.companyName),
        getAppSetting(appSettingKeys.companyAddress),
        getAppSetting(appSettingKeys.companyNip),
        getAppSetting(appSettingKeys.companyBankName),
        getAppSetting(appSettingKeys.companyBankAccount),
        getFluentFormsSecret(),
        getAppSetting(appSettingKeys.portalEnabled),
        getAppSetting(appSettingKeys.smsProvider),
        getAppSetting(appSettingKeys.smsToken),
        getAppSetting(appSettingKeys.smsSenderName),
	]);

    const statusOptions = montageStatusDefinitions.map(def => ({
        value: def.id,
        label: def.label,
        description: def.description
    }));

    const montageNotifications = montageNotificationsJson ? JSON.parse(montageNotificationsJson) : {};

	const [pendingRow] = await db
		.select({ count: sql<number>`count(*)` })
		.from(manualOrders)
		.where(eq(manualOrders.requiresReview, true));

	const pendingReviewCount = Number(pendingRow?.count ?? 0);

	const rawLogs = await db
		.select({
			id: integrationLogs.id,
			createdAt: integrationLogs.createdAt,
			level: integrationLogs.level,
			message: integrationLogs.message,
		})
		.from(integrationLogs)
		.where(eq(integrationLogs.integration, 'woocommerce'))
		.orderBy(desc(integrationLogs.createdAt))
		.limit(20);

	const rawSystemLogs = await db
		.select({
			id: systemLogs.id,
			createdAt: systemLogs.createdAt,
			action: systemLogs.action,
			details: systemLogs.details,
			userName: users.name,
			userEmail: users.email,
		})
		.from(systemLogs)
		.leftJoin(users, eq(systemLogs.userId, users.id))
		.orderBy(desc(systemLogs.createdAt))
		.limit(50);

	const logs: LogRow[] = rawLogs.map((log) => ({
		id: log.id ?? crypto.randomUUID(),
		createdAt:
			log.createdAt instanceof Date
				? log.createdAt.getTime()
				: typeof log.createdAt === 'number'
					? log.createdAt
					: null,
		level: (log.level ?? 'info') as LogLevel,
		message: log.message ?? '',
	}));

	const lastEvent = logs[0] ?? null;

	const r2Configured = Boolean(
		r2AccountIdSetting &&
		r2AccessKeyIdSetting &&
		r2SecretAccessKeySetting &&
		r2BucketNameSetting &&
		r2EndpointSetting &&
		r2PublicBaseUrlSetting,
	);
	const r2StatusBadgeClass = r2Configured
		? 'bg-emerald-100 text-emerald-900 border-transparent'
		: 'border border-dashed text-muted-foreground';
	const r2StatusLabel = r2Configured ? 'Skonfigurowano' : 'Brak konfiguracji';

	const mailRows = await db
		.select()
		.from(mailAccounts)
		.orderBy(mailAccounts.displayName);

	const formattedMailAccounts = mailRows.map((account) => ({
		id: account.id,
		displayName: account.displayName,
		email: account.email,
		provider: account.provider,
		status: account.status,
		imapHost: account.imapHost,
		imapPort: account.imapPort,
		imapSecure: account.imapSecure,
		smtpHost: account.smtpHost,
		smtpPort: account.smtpPort,
		smtpSecure: account.smtpSecure,
		username: account.username,
		signature: account.signature,
		hasPassword: Boolean(account.passwordSecret),
		lastSyncAt: account.lastSyncAt?.toISOString() ?? null,
		nextSyncAt: account.nextSyncAt?.toISOString() ?? null,
	}));

    // Read business logic documentation
    let businessLogicContent = '';
    try {
        const docsPath = path.join(process.cwd(), 'docs', 'business-logic.md');
        if (fs.existsSync(docsPath)) {
            businessLogicContent = fs.readFileSync(docsPath, 'utf-8');
        } else {
            businessLogicContent = '# Błąd\n\nNie znaleziono pliku dokumentacji.';
        }
    } catch (error) {
        console.error('Failed to read documentation:', error);
        businessLogicContent = '# Błąd\n\nWystąpił błąd podczas odczytu dokumentacji.';
    }

    const contractTemplates = await getContractTemplates();
    const serializedTemplates = contractTemplates.map(t => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
    }));

	return (
		<SettingsView
            documentation={
                <DocumentationView content={businessLogicContent} />
            }
            appearance={
                <div className="grid gap-4">
                    <LogoSettings currentLogoUrl={systemLogoUrl ?? null} />
                    <Card>
                        <CardHeader>
                            <CardTitle>Motyw aplikacji</CardTitle>
                            <CardDescription>
                                Wybierz klimat swojej pracy. Dostosuj wygląd panelu do swoich preferencji.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ThemeSelector />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Gęstość interfejsu</CardTitle>
                            <CardDescription>
                                Dostosuj ilość informacji widocznych na ekranie.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DensitySelector />
                        </CardContent>
                    </Card>
                </div>
            }
			montageSettings={
				<div className="space-y-6">
					<AutomationRegistry 
                        templates={montageChecklistTemplates} 
                        initialRules={montageAutomationRules} 
                        statusOptions={statusOptions}
                        initialNotifications={montageNotifications}
                    />
				</div>
			}
			logs={
				<Tabs defaultValue="system" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="system">Logi systemowe</TabsTrigger>
						<TabsTrigger value="integration">Logi integracji</TabsTrigger>
					</TabsList>
					<TabsContent value="system">
						<Card>
							<CardHeader>
								<CardTitle>Logi systemowe</CardTitle>
								<CardDescription>Historia aktywności użytkowników i zdarzeń systemowych.</CardDescription>
							</CardHeader>
							<CardContent>
								{rawSystemLogs.length === 0 ? (
									<p className="text-sm text-muted-foreground">Brak logów systemowych.</p>
								) : (
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Data</TableHead>
													<TableHead>Użytkownik</TableHead>
													<TableHead>Akcja</TableHead>
													<TableHead>Szczegóły</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{rawSystemLogs.map((log) => (
													<TableRow key={log.id}>
														<TableCell className="whitespace-nowrap">{formatTimestamp(log.createdAt)}</TableCell>
														<TableCell>
															{log.userName ? (
																<div className="flex flex-col">
																	<span className="font-medium">{log.userName}</span>
																	<span className="text-xs text-muted-foreground">{log.userEmail}</span>
																</div>
															) : (
																<span className="text-muted-foreground italic">System</span>
															)}
														</TableCell>
														<TableCell>
															<Badge variant="outline">{log.action}</Badge>
														</TableCell>
														<TableCell className="max-w-md whitespace-normal text-xs font-mono">
															{log.details}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="integration">
						<Card>
							<CardHeader>
								<CardTitle>Logi integracji</CardTitle>
								<CardDescription>Ostatnie wpisy zapisywane podczas przetwarzania webhooka.</CardDescription>
							</CardHeader>
							<CardContent>
								{logs.length === 0 ? (
									<p className="text-sm text-muted-foreground">Brak logów dla integracji WooCommerce.</p>
								) : (
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Data</TableHead>
													<TableHead>Poziom</TableHead>
													<TableHead>Opis</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{logs.map((log) => (
													<TableRow key={log.id}>
														<TableCell>{formatTimestamp(log.createdAt)}</TableCell>
														<TableCell>
															<Badge className={levelBadgeClass(log.level)}>{log.level}</Badge>
														</TableCell>
														<TableCell className="max-w-md whitespace-normal text-xs">
															{log.message}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			}
			integrations={
				<Tabs defaultValue="woocommerce" className="w-full">
					<div className="mb-4">
						{/* Mobile: Select */}
						<div className="md:hidden">
							{/* We need a client component to handle Select value change if we want to control Tabs, 
							    but Tabs component from shadcn/ui doesn't easily support external control via Select 
							    unless we wrap it in a client component. 
							    Alternatively, we can just stack the tabs on mobile or use a scrollable list.
							    The user said "scroll on top is uncomfortable".
							    Let's try stacking them or making them look like buttons.
							*/}
							<TabsList className="flex flex-col h-auto w-full gap-2 bg-transparent p-0">
								<TabsTrigger value="woocommerce" className="w-full justify-start border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">WooCommerce</TabsTrigger>
								<TabsTrigger value="google" className="w-full justify-start border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Kalendarz Google</TabsTrigger>
								<TabsTrigger value="mail" className="w-full justify-start border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Poczta</TabsTrigger>
								<TabsTrigger value="storage" className="w-full justify-start border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Magazyn plików</TabsTrigger>
                                <TabsTrigger value="fluent" className="w-full justify-start border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Fluent Forms (WP)</TabsTrigger>
							</TabsList>
						</div>

						{/* Desktop: Grid */}
						<div className="hidden md:block">
							<TabsList className="grid w-full grid-cols-5">
								<TabsTrigger value="woocommerce">WooCommerce</TabsTrigger>
								<TabsTrigger value="google">Kalendarz Google</TabsTrigger>
								<TabsTrigger value="mail">Poczta</TabsTrigger>
								<TabsTrigger value="storage">Magazyn plików</TabsTrigger>
                                <TabsTrigger value="fluent">Fluent Forms</TabsTrigger>
							</TabsList>
						</div>
					</div>
					<TabsContent value="woocommerce" className="space-y-6">
						<div className="grid gap-6 md:grid-cols-2">
							<div className="space-y-6">
								<WooSettingsForm 
                                    initialSettings={{
                                        consumerKey: wooConsumerKeySetting ?? '',
                                        consumerSecret: wooConsumerSecretSetting ?? '',
                                        webhookSecret: webhookSecretSetting ?? '',
                                        wooUrl: wooUrlSetting ?? '',
                                    }} 
                                    webhookUrl={webhookUrl}
                                />
							</div>
							
							<div>
								<IntegrationLogs logs={logs.map(l => ({
									...l,
									meta: null,
									createdAt: l.createdAt ? new Date(l.createdAt) : new Date()
								}))} />
							</div>
						</div>
					</TabsContent>
					<TabsContent value="google">
						<GoogleCalendarSettingsForm 
							initialCalendarId={googleCalendarId ?? ''} 
							initialClientEmail={googleClientEmail ?? ''}
							initialPrivateKey={googlePrivateKey ?? ''}
                            initialOAuthClientId={googleOAuthClientId ?? ''}
                            initialOAuthClientSecret={googleOAuthClientSecret ?? ''}
						/>
					</TabsContent>
					<TabsContent value="mail">
						<MailSettingsForm accounts={formattedMailAccounts} />
					</TabsContent>
					<TabsContent value="storage">
						<Card>
							<CardHeader>
								<CardTitle>Cloudflare R2</CardTitle>
								<CardDescription>Skonfiguruj magazyn do przechowywania zalacznikow klientow.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex flex-wrap items-center gap-2 text-sm">
									<Badge className={r2StatusBadgeClass}>{r2StatusLabel}</Badge>
									{r2BucketNameSetting ? <span className="text-muted-foreground">Bucket {r2BucketNameSetting}</span> : null}
								</div>
								<R2ConfigForm
									initialAccountId={r2AccountIdSetting ?? ''}
									initialAccessKeyId={r2AccessKeyIdSetting ?? ''}
									initialSecretAccessKey={r2SecretAccessKeySetting ?? ''}
									initialBucketName={r2BucketNameSetting ?? ''}
									initialEndpoint={r2EndpointSetting ?? ''}
									initialPublicBaseUrl={r2PublicBaseUrlSetting ?? ''}
									initialApiToken={r2ApiTokenSetting ?? ''}
								/>
								<div className="space-y-2 text-xs text-muted-foreground">
									<p>
										Trzymaj wartosci w bazie albo ustaw je w <code>.env.local</code> (zmienne <code>CLOUDFLARE_R2_*</code>).
										Pole tokenu API jest opcjonalne i potrzebne tylko przy wywolaniach HTTP do Cloudflare.
									</p>
									<ul className="list-disc space-y-1 pl-5">
										<li><code>Account ID</code> znajduje sie w Cloudflare R2.</li>
										<li><code>Access Key ID</code> i <code>Secret Access Key</code> autoryzuja klienta S3.</li>
										<li><code>Endpoint</code> powinien wskazywac region, np. <code>https://...r2.cloudflarestorage.com</code>.</li>
										<li><code>Publiczny URL</code> to adres <code>*.r2.dev</code>, ktory pokazujesz klientom (bez trailing <code>/</code>).</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
                    <TabsContent value="fluent">
                        <FluentFormsSettings 
                            initialSecret={fluentFormsSecret} 
                            baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'https://twoja-domena.pl'} 
                        />
                    </TabsContent>
				</Tabs>
			}
			mobileMenuSettings={
				<MobileMenuSettings initialConfig={mobileMenuConfig} />
			}
			kpiSettings={
				<KpiSettingsForm 
					initialMontageThreatDays={Number(kpiMontageThreatDays ?? 7)}
					initialOrderUrgentDays={Number(kpiOrderUrgentDays ?? 3)}
                    initialAlertMissingMaterialStatusDays={Number(kpiAlertMissingMaterialStatusDays ?? 7)}
                    initialAlertMissingInstallerStatusDays={Number(kpiAlertMissingInstallerStatusDays ?? 7)}
                    initialAlertMissingMeasurerDays={Number(kpiAlertMissingMeasurerDays ?? 14)}
                    initialAlertMissingInstallerDays={Number(kpiAlertMissingInstallerDays ?? 14)}
                    initialAlertMaterialOrderedDays={Number(kpiAlertMaterialOrderedDays ?? 5)}
                    initialAlertMaterialInstockDays={Number(kpiAlertMaterialInstockDays ?? 2)}
                    initialAlertLeadNoMeasurerDays={Number(kpiAlertLeadNoMeasurerDays ?? 3)}
                    initialAlertQuoteDelayDays={Number(kpiAlertQuoteDelayDays ?? 3)}
                    initialAlertOfferStalledDays={Number(kpiAlertOfferStalledDays ?? 7)}
				/>
			}
			wpChanges={
				<WpChangesSettings />
			}
            teamSettings={null}
            trash={
                <TrashView 
                    deletedQuotes={deletedQuotes} 
                    deletedCustomers={deletedCustomers}
                    deletedMontages={deletedMontages}
                    deletedProducts={deletedProducts}
                />
            }
            portalSettings={
                <PortalSettingsForm 
                    initialEnabled={portalEnabled === 'true'}
                    initialSmsProvider={smsProvider ?? 'smsapi'}
                    initialSmsToken={smsToken ?? ''}
                    initialSmsSenderName={smsSenderName ?? 'Info'}
                />
            }
            contractTemplatesManager={
                <ContractTemplatesManager templates={serializedTemplates} />
            }
		>
            <div className="space-y-6">
                <CompanySettingsForm
                    initialName={companyName ?? ''}
                    initialAddress={companyAddress ?? ''}
                    initialNip={companyNip ?? ''}
                    initialBankName={companyBankName ?? ''}
                    initialBankAccount={companyBankAccount ?? ''}
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Status integracji</CardTitle>
                        <CardDescription>Podglad biezacych danych z backendu.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <dl className="grid gap-3 text-sm">
                            <div>
                                <dt className="text-muted-foreground">Zamowienia do potwierdzenia</dt>
                                <dd className="text-base font-semibold">{pendingReviewCount}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Ostatnie zdarzenie webhooka</dt>
                                <dd className="flex flex-wrap items-center gap-2">
                                    {lastEvent ? (
                                        <>
                                            <Badge className={levelBadgeClass(lastEvent.level)}>{lastEvent.level}</Badge>
                                            <span>{formatTimestamp(lastEvent.createdAt)}</span>
                                        </>
                                    ) : (
                                        <span>Brak zdarzen</span>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Ostatnia wiadomosc</dt>
                                <dd className="text-xs text-foreground/80">
                                    {lastEvent?.message ?? 'Brak wpisow w logach integracji.'}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            </div>
		</SettingsView>
	);
}
