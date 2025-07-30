
// src/components/quote-activity-sheet.tsx
'use client';

import { useMemo } from 'react';
import type { ChangeLogEntry, Quote } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, MessageSquare, Send, CheckCircle, History, SendHorizonal } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivitySheetProps {
  quote: Quote | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type TimelineEventType = 'sent' | 'viewed' | 'changes_requested' | 'accepted' | 'revision_sent';

type TimelineEvent = {
  type: TimelineEventType;
  timestamp: string;
  description: string;
  author?: string;
};

const ICONS: Record<TimelineEventType, React.ElementType> = {
  sent: Send,
  viewed: Eye,
  changes_requested: MessageSquare,
  accepted: CheckCircle,
  revision_sent: SendHorizonal,
};

const COLORS: Record<TimelineEventType, string> = {
  sent: 'text-blue-500',
  viewed: 'text-purple-500',
  changes_requested: 'text-orange-500',
  accepted: 'text-green-600',
  revision_sent: 'text-blue-500',
};

function getEventTypeAndDescription(log: ChangeLogEntry): { type: TimelineEventType, description: string } {
    if (log.description.startsWith('Revision Sent')) {
        return { type: 'revision_sent', description: log.description };
    }
    return { type: 'changes_requested', description: log.description };
}

export function QuoteActivitySheet({ quote, isOpen, onOpenChange }: ActivitySheetProps) {
  const timelineEvents = useMemo(() => {
    if (!quote) return [];

    const events: TimelineEvent[] = [];

    // Sent event
    if (quote.sentAt) {
      events.push({
        type: 'sent',
        timestamp: quote.sentAt,
        description: 'Quote sent to customer',
      });
    }

    // Viewed events
    (quote.viewHistory || []).forEach(view => {
      events.push({
        type: 'viewed',
        timestamp: view.timestamp,
        description: 'Quote viewed by customer',
      });
    });
    
    // Change log events (customer-facing and internal notes)
    (quote.changeLog || []).forEach(log => {
        const { type, description } = getEventTypeAndDescription(log);
        events.push({
            type,
            timestamp: log.timestamp,
            description: description,
            author: log.author,
        });
    });

    // Accepted event
    if (quote.acceptedAt) {
      events.push({
        type: 'accepted',
        timestamp: quote.acceptedAt,
        description: 'Quote accepted!',
      });
    }
    
    // Sort events from oldest to most recent for bottom-to-top flow
    return events.sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());

  }, [quote]);

  if (!quote) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-primary" />
            <div>
                <SheetTitle className="text-xl font-light">
                    Activity for {quote.quoteNumber}
                </SheetTitle>
                <SheetDescription>
                    A log of all major events for this quote.
                </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="relative p-6 overflow-auto">
            {timelineEvents.length > 0 ? (
                <div className="flex flex-col-reverse">
                    {timelineEvents.map((event, index) => {
                        const Icon = ICONS[event.type];
                        const colorClass = COLORS[event.type];
                        
                        return (
                            <div key={index} className="flex gap-4">
                                {/* Timeline line and icon */}
                                <div className="relative flex flex-col items-center">
                                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-muted", colorClass)}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    {index > 0 && (
                                        <div className="w-px flex-1 bg-border/70 my-1"></div>
                                    )}
                                </div>
                                {/* Content */}
                                <div className="pb-8 flex-1">
                                    <p className="font-semibold text-sm capitalize">{event.type.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{format(parseISO(event.timestamp), "PPP 'at' p")}</p>
                                    <p className="text-sm mt-2 text-foreground/90 whitespace-pre-wrap">{event.description}</p>
                                    {event.author && <p className="text-xs text-muted-foreground mt-1">- {event.author}</p>}
                                </div>
                            </div>
                        );
                    }).reverse()}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    <p>No activity has been recorded yet.</p>
                </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
