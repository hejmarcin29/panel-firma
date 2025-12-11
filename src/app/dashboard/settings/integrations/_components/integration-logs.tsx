'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface LogEntry {
	id: string;
	level: 'info' | 'warning' | 'error';
	message: string;
	meta: unknown;
	createdAt: Date;
}

interface IntegrationLogsProps {
	logs: LogEntry[];
}

export function IntegrationLogs({ logs }: IntegrationLogsProps) {
	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle>Logi Integracji</CardTitle>
				<CardDescription>Ostatnie zdarzenia z systemu integracji.</CardDescription>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[400px] pr-4">
					{logs.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">Brak logów.</p>
					) : (
						<div className="space-y-4">
							{logs.map((log) => (
								<div key={log.id} className="flex flex-col gap-1 border-b pb-3 last:border-0">
									<div className="flex items-center justify-between">
										<Badge
											variant={
												log.level === 'error'
													? 'destructive'
													: log.level === 'warning'
													? 'secondary' // or a custom warning variant
													: 'outline'
											}
                                            className={log.level === 'warning' ? 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200' : ''}
										>
											{log.level.toUpperCase()}
										</Badge>
										<span className="text-xs text-muted-foreground">
											{format(new Date(log.createdAt), 'PP pp', { locale: pl })}
										</span>
									</div>
									<p className="text-sm font-medium mt-1">{log.message}</p>
                                    {!!log.meta && (
                                        <pre className="text-[10px] bg-muted p-2 rounded overflow-x-auto mt-1">
                                            {(() => {
                                                try {
                                                    return JSON.stringify(typeof log.meta === 'string' ? JSON.parse(log.meta) : log.meta, null, 2);
                                                } catch {
                                                    return String(log.meta);
                                                }
                                            })()}
                                        </pre>
                                    )}
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
