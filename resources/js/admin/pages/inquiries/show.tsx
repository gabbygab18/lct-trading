import { Badge } from '@/components/glint/badge';
import { Card, CardTitle, ConfirmButton } from '@/admin/components/kit';
import { whenTime } from '@/admin/lib/format';
import { Icon } from '@/icons';
import { router } from '@inertiajs/react';

interface Inquiry {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    topic: string;
    message: string;
    created_at: string;
}

export default function InquiryShow({ inquiry }: { inquiry: Inquiry }) {
    return (
        <div className="grid items-start gap-4 xl:grid-cols-[1fr_320px]">
            <Card>
                <CardTitle action={<Badge variant="secondary">{inquiry.topic}</Badge>}>{whenTime(inquiry.created_at)}</CardTitle>
                <p className="text-[15px] leading-relaxed whitespace-pre-line">{inquiry.message}</p>
            </Card>

            <aside className="space-y-4">
                <Card className="space-y-2 text-sm">
                    <p className="text-lg font-semibold">{inquiry.name}</p>
                    <a href={`tel:${inquiry.phone.replace(/[^0-9+]/g, '')}`} className="font-display text-primary block text-xl font-bold">
                        {inquiry.phone}
                    </a>
                    {inquiry.email && (
                        <a href={`mailto:${inquiry.email}`} className="text-muted-foreground block underline">
                            {inquiry.email}
                        </a>
                    )}
                </Card>
                <ConfirmButton
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    startIcon={<Icon name="trash" className="size-4" />}
                    title="Delete this inquiry?"
                    description={`From ${inquiry.name}. This can't be undone.`}
                    confirm="Delete inquiry"
                    onConfirm={() => router.delete(`/admin/inquiries/${inquiry.id}`)}
                >
                    Delete this inquiry
                </ConfirmButton>
            </aside>
        </div>
    );
}
