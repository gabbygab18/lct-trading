import { Button, type ButtonVariant } from '@/components/glint/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/glint/dialog';
import { Pagination } from '@/components/glint/pagination';
import { fmt } from '@/admin/lib/format';
import type { Paginated } from '@/admin/lib/types';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { useState, type HTMLAttributes, type LabelHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

/** lct-stocks' dashboard card and its red-ruled title. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('bg-card min-w-0 rounded-3xl p-5 shadow-sm', className)} {...props} />;
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="border-primary border-l-[3px] pl-2.5 font-bold">{children}</h2>
            {action}
        </div>
    );
}

export function ViewAll({ href }: { href: string }) {
    return (
        <Link prefetch href={href} className="hover:bg-muted rounded-full border px-3 py-1 text-xs font-medium transition-colors">
            View all
        </Link>
    );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
    return <label className={cn('text-sm leading-none font-medium select-none', className)} {...props} />;
}

export function Hint({ children }: { children: ReactNode }) {
    return <p className="text-muted-foreground text-xs">{children}</p>;
}

export function FieldError({ message }: { message?: string }) {
    return message ? <p className="text-destructive text-sm">{message}</p> : null;
}

/** Multi-line twin of glint's Input, same border, radius and focus ring. */
export function Textarea({ className, error, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
    return (
        <>
            <textarea
                aria-invalid={error ? true : undefined}
                className={cn(
                    'border-input bg-background text-foreground placeholder:text-muted-foreground hover:border-foreground/25 focus:border-ring aria-invalid:border-destructive/70 w-full rounded-xl border px-3 py-2.5 text-sm shadow-xs transition-[border-color,box-shadow] duration-200 outline-none focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_25%,transparent)]',
                    className,
                )}
                {...props}
            />
            <FieldError message={error} />
        </>
    );
}

/** "1–30 of 120 orders" and glint's Pagination, driving the current URL's ?page. */
export function PageFooter<T>({ page, noun }: { page: Paginated<T>; noun: string }) {
    const go = (p: number) => {
        const url = new URL(window.location.href);
        url.searchParams.set('page', String(p));
        router.get(url.pathname + url.search, {}, { preserveState: true, preserveScroll: false });
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">{page.total ? `${fmt(page.from ?? 0)}–${fmt(page.to ?? 0)} of ${fmt(page.total)} ${noun}` : `No ${noun}`}</p>
            {page.last_page > 1 && <Pagination total={page.last_page} page={page.current_page} onPageChange={go} />}
        </div>
    );
}

/** A button that asks first, in glint's Dialog, then runs onConfirm. */
export function ConfirmButton({
    children,
    title,
    description,
    confirm,
    onConfirm,
    variant = 'outline',
    confirmVariant = 'destructive',
    className,
    startIcon,
}: {
    children: ReactNode;
    title: string;
    description?: ReactNode;
    confirm: string;
    onConfirm: () => void;
    variant?: ButtonVariant;
    confirmVariant?: ButtonVariant;
    className?: string;
    startIcon?: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button type="button" variant={variant} className={className} startIcon={startIcon} onClick={() => setOpen(true)}>
                {children}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Keep it
                        </Button>
                        <Button
                            variant={confirmVariant}
                            onClick={() => {
                                setOpen(false);
                                onConfirm();
                            }}
                        >
                            {confirm}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
