import { Badge } from '@/components/glint/badge';
import { PageFooter } from '@/admin/components/kit';
import { ResponsiveTable } from '@/admin/components/responsive-table';
import { whenTime } from '@/admin/lib/format';
import type { Paginated } from '@/admin/lib/types';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

interface Row {
    id: number;
    name: string;
    phone: string;
    topic: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export default function Inquiries({ inquiries }: { inquiries: Paginated<Row> }) {
    return (
        <div className="bg-card space-y-4 rounded-3xl p-4 shadow-sm sm:p-5">
            <p className="text-muted-foreground text-sm">Messages from the contact form on the site. Newest first.</p>
            <ResponsiveTable
                selectable={false}
                rows={inquiries.data}
                empty="No inquiries yet. Messages from the contact form land here."
                columns={[
                    {
                        key: 'name',
                        header: 'From',
                        cell: (q) => (
                            <Link prefetch href={`/admin/inquiries/${q.id}`} className="group block">
                                <span className={cn('group-hover:text-primary block font-medium', !q.is_read && 'text-primary')}>{q.name}</span>
                                <span className="text-muted-foreground text-xs">{q.phone}</span>
                            </Link>
                        ),
                    },
                    { key: 'topic', header: 'Topic', cell: (q) => <Badge variant="secondary">{q.topic}</Badge> },
                    { key: 'message', header: 'Message', cell: (q) => <span className="line-clamp-2 max-w-md whitespace-normal">{q.message}</span> },
                    {
                        key: 'created_at',
                        header: 'Received',
                        sortable: true,
                        cell: (q) => (
                            <span className="text-muted-foreground flex items-center gap-2 text-xs">
                                {!q.is_read && <Badge size="sm" variant="destructive" dot pulse>New</Badge>}
                                {whenTime(q.created_at)}
                            </span>
                        ),
                    },
                ]}
            />
            <PageFooter page={inquiries} noun="inquiries" />
        </div>
    );
}
