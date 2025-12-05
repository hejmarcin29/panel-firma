'use client';

import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DocumentationViewProps {
  content: string;
}

export function DocumentationView({ content }: DocumentationViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumentacja Logiki Biznesowej</CardTitle>
        <CardDescription>
          Zasady działania systemu, role i procesy. Plik źródłowy: docs/business-logic.md
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
