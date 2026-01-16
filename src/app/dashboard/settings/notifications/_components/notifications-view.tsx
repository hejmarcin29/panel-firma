'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Edit2, Mail, MessageSquare, Zap } from 'lucide-react';
import { NOTIFICATION_EVENTS } from '@/lib/notifications/events';
import { TemplateEditor } from './template-editor';
import { toggleChannel } from '../actions';
import { toast } from 'sonner';

export function NotificationsView({ templates }: { templates: any[] }) {
    const [activeTab, setActiveTab] = useState('shop');
    const [editingTemplate, setEditingTemplate] = useState<{ t: any, def: any } | null>(null);

    // Group events by category
    const categories = {
        shop: Object.values(NOTIFICATION_EVENTS).filter(e => e.category === 'shop'),
        crm: Object.values(NOTIFICATION_EVENTS).filter(e => e.category === 'crm'),
        b2b: Object.values(NOTIFICATION_EVENTS).filter(e => e.category === 'b2b'),
    };

    const getTemplate = (eventId: string, channel: string) => {
        return templates.find(t => t.eventId === eventId && t.channel === channel);
    };

    const handleToggle = async (eventId: string, channel: 'email' | 'sms', currentState: boolean) => {
        // Optimistic UI could be added here, but for settings, standard await is fine
        try {
            await toggleChannel(eventId, channel, !currentState);
            toast.success('Zaktualizowano');
        } catch (e) {
            toast.error('Błąd aktualizacji');
        }
    };

    const openEditor = (eventId: string, channel: string) => {
        const template = getTemplate(eventId, channel);
        const eventDef = Object.values(NOTIFICATION_EVENTS).find(e => e.id === eventId);
        
        if (!template) {
            // Need to toggle ON first usually, but we can allow editing inactive templates if they exist in DB.
            // If they don't exist in DB at all, we can't edit ID.
            // For MVP: Tell user to enable first.
            toast.warning('Włącz najpierw ten kanał, aby go edytować.');
            return;
        }
        
        setEditingTemplate({ t: template, def: eventDef });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Centrum Powiadomień</CardTitle>
                <CardDescription>Zarządzaj automatyczną komunikacją wychodzącą (Email, SMS).</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="shop">🛒 Sklep</TabsTrigger>
                        <TabsTrigger value="crm">🛠️ Montaże</TabsTrigger>
                        <TabsTrigger value="b2b">🤝 Partnerzy</TabsTrigger>
                    </TabsList>

                    {Object.entries(categories).map(([catKey, events]) => (
                        <TabsContent key={catKey} value={catKey} className="space-y-4">
                            <div className="border rounded-lg overflow-hidden">
                                <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium text-muted-foreground">
                                    <div className="col-span-6">Zdarzenie</div>
                                    <div className="col-span-3 text-center flex items-center justify-center gap-2"><Mail className="w-4 h-4"/> Email</div>
                                    <div className="col-span-3 text-center flex items-center justify-center gap-2"><MessageSquare className="w-4 h-4"/> SMS</div>
                                </div>
                                <div className="divide-y">
                                    {events.map(event => {
                                        const emailTpl = getTemplate(event.id, 'email');
                                        const smsTpl = getTemplate(event.id, 'sms');
                                        
                                        const emailActive = emailTpl?.isActive ?? false;
                                        const smsActive = smsTpl?.isActive ?? false;

                                        return (
                                            <div key={event.id} className="grid grid-cols-12 p-4 items-center hover:bg-gray-50 transition-colors">
                                                <div className="col-span-6">
                                                    <div className="font-medium text-gray-900">{event.label}</div>
                                                    <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[10px] h-5">{event.id}</Badge>
                                                    </div>
                                                </div>
                                                
                                                {/* Email Column */}
                                                <div className="col-span-3 flex items-center justify-center gap-3">
                                                    <Switch 
                                                        checked={emailActive} 
                                                        onCheckedChange={() => handleToggle(event.id, 'email', emailActive)}
                                                    />
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => openEditor(event.id, 'email')}
                                                        disabled={!emailTpl} // If not in DB at all
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {/* SMS Column */}
                                                <div className="col-span-3 flex items-center justify-center gap-3">
                                                    <Switch 
                                                        checked={smsActive} 
                                                        onCheckedChange={() => handleToggle(event.id, 'sms', smsActive)}
                                                    />
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => openEditor(event.id, 'sms')}
                                                        disabled={!smsTpl}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>

                <TemplateEditor 
                    open={!!editingTemplate} 
                    onOpenChange={(v) => !v && setEditingTemplate(null)}
                    template={editingTemplate?.t}
                    eventDef={editingTemplate?.def}
                />
            </CardContent>
        </Card>
    );
}
