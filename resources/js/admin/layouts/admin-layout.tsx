import { Avatar } from '@/components/glint/avatar';
import { Button } from '@/components/glint/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/glint/dropdown-menu';
import { Input } from '@/components/glint/input';
import { StretchRail } from '@/components/glint/stretch-rail';
import { ToastProvider, useToast } from '@/components/glint/toast';
import { Download, Grid, Icon, LogOut, Menu, Package, PlusCircle, Search, Settings } from '@/icons';
import type { AdminProps } from '@/admin/lib/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState, type ReactNode } from 'react';

const NAV = [
    { label: 'Dashboard', url: '/admin', icon: <Grid />, exact: true },
    { label: 'Orders', url: '/admin/orders', icon: <Icon name="receipt" />, count: 'orders' as const },
    { label: 'Inquiries', url: '/admin/inquiries', icon: <Icon name="chat" />, count: 'inquiries' as const },
    { label: 'Items', url: '/admin/items', icon: <Package /> },
];

// The sidebar keeps lct-stocks' short Tools list so the red card always fits:
// Add item sits in the header, the sheet upload is the red card itself.
const TOOLS = [{ label: 'Settings', url: '/admin/settings', icon: Settings }];

// Phones and tablets have no sidebar, so their menu lists everything.
const MOBILE = [
    { label: 'Add item', url: '/admin/items/create', icon: <PlusCircle /> },
    { label: 'Excel / CSV upload', url: '/admin/items/import', icon: <Icon name="upload" /> },
    { label: 'Settings', url: '/admin/settings', icon: <Settings /> },
];

const logout = () => router.post('/admin/logout');

function navIndex(path: string) {
    if (path === '/admin' || path === '/admin/') return 0;
    if (path.startsWith('/admin/items/create') || path.startsWith('/admin/items/import')) return -1;
    return NAV.findIndex((n, i) => i > 0 && path.startsWith(n.url));
}

function FlashToasts() {
    const { flash } = usePage<AdminProps>().props;
    const { toast } = useToast();

    useEffect(() => {
        if (flash.success) toast({ title: 'Saved', description: flash.success, variant: 'success' });
        if (flash.error) toast({ title: 'Not done', description: flash.error, variant: 'error', duration: 8000 });
    }, [flash, toast]);

    return null;
}

/** lct-stocks' AppSidebarLayout, pointed at the shop's admin pages. */
export default function AdminLayout({ children, title }: { children: ReactNode; title?: string }) {
    const page = usePage<AdminProps>();
    const { auth, counts, shopUrl } = page.props;
    const path = page.url.split('?')[0];
    const active = navIndex(path);
    const [q, setQ] = useState('');
    const user = auth.user ?? { name: 'Admin', email: '' };
    const heading = title ?? (page.props.title as string | undefined) ?? 'LCT Trading';

    return (
        <ToastProvider placement="top-right">
            <FlashToasts />
            <div className="min-h-screen overflow-x-clip bg-[#f4f4f2] lg:flex lg:gap-4 lg:p-4 dark:bg-[#111113]">
                {/* Sidebar: always dark, like lct-stocks. */}
                <aside className="dark bg-background text-foreground sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col overflow-y-auto rounded-3xl p-5 [scrollbar-width:none] lg:flex">
                    <Link href="/admin" className="mb-8 flex items-center gap-2.5 px-1">
                        <img src="/images/lct-mark.webp" alt="" className="size-10 object-contain" />
                        <span className="leading-tight">
                            <span className="block text-lg font-bold tracking-tight">LCT Trading</span>
                            <span className="text-muted-foreground block text-[10px] tracking-[0.18em] uppercase">Tools &amp; Hardware</span>
                        </span>
                    </Link>

                    <p className="text-muted-foreground mb-2 px-1 text-xs font-medium tracking-wider uppercase">Menu</p>
                    <StretchRail
                        items={NAV.map(({ label, icon, count }) => ({
                            label,
                            icon,
                            badge: count && counts?.[count] ? String(counts[count]) : undefined,
                        }))}
                        active={active}
                        color="#d7141a"
                        onSelect={(i) => router.visit(NAV[i].url)}
                    />

                    <p className="text-muted-foreground mt-8 mb-2 px-1 text-xs font-medium tracking-wider uppercase">Tools</p>
                    <nav className="grid gap-1 pl-4 text-sm font-medium">
                        <a
                            href="/admin/items/export"
                            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2.5"
                        >
                            <Download className="size-4" /> Export CSV
                        </a>
                        {TOOLS.map(({ label, url, icon: ToolIcon }) => (
                            <Link
                                key={url}
                                href={url}
                                aria-current={path.startsWith(url) ? 'page' : undefined}
                                className="text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground flex items-center gap-3 rounded-lg px-3 py-2.5 aria-[current=page]:font-semibold aria-[current=page]:[&>svg]:text-[#d7141a]"
                            >
                                <ToolIcon className="size-4" /> {label}
                            </Link>
                        ))}
                        <a
                            href={shopUrl}
                            target="_blank"
                            rel="noopener"
                            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2.5"
                        >
                            <Icon name="store" className="size-4" /> View shop
                        </a>
                        <button
                            onClick={logout}
                            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2.5 text-left"
                        >
                            <LogOut className="size-4" /> Log out
                        </button>
                    </nav>

                    <div className="mt-auto shrink-0 rounded-2xl bg-gradient-to-br from-[#d7141a] to-[#8f0b10] p-4 text-white">
                        <PlusCircle className="mb-3 size-8 opacity-90" />
                        <p className="leading-snug font-semibold">Got new stock or prices?</p>
                        <p className="mt-1 text-xs text-red-100">Upload the supplier sheet so the shop stays right.</p>
                        <Link
                            href="/admin/items/import"
                            className="mt-3 block w-full rounded-xl bg-white/20 py-2 text-center text-sm font-medium backdrop-blur transition hover:bg-white/30"
                        >
                            Upload sheet
                        </Link>
                    </div>
                </aside>

                <main className="min-w-0 flex-1 space-y-4 p-3 lg:p-0">
                    <header className="bg-card flex items-center gap-3 rounded-3xl px-4 py-3 shadow-sm sm:px-6">
                        <DropdownMenu>
                            <DropdownMenuTrigger aria-label="Menu" className="hover:bg-muted rounded-lg p-2 lg:hidden">
                                <Menu className="size-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {NAV.map((n) => (
                                    <DropdownMenuItem key={n.url} icon={n.icon} onSelect={() => router.visit(n.url)}>
                                        {n.label}
                                    </DropdownMenuItem>
                                ))}
                                {MOBILE.map((m) => (
                                    <DropdownMenuItem key={m.url} icon={m.icon} onSelect={() => router.visit(m.url)}>
                                        {m.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <h1 className="truncate text-lg font-black sm:text-xl">{heading}</h1>

                        <form
                            className="ml-auto hidden w-80 md:block"
                            role="search"
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.get('/admin/items', q ? { q } : {});
                            }}
                        >
                            <Input
                                size="sm"
                                type="search"
                                aria-label="Search items"
                                placeholder="Search items…"
                                startIcon={<Search className="size-4" />}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </form>

                        <Button
                            size="sm"
                            className="ml-auto hidden rounded-full sm:inline-flex md:ml-0"
                            startIcon={<PlusCircle className="size-4" />}
                            onClick={() => router.visit('/admin/items/create')}
                        >
                            Add item
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger className="hover:bg-muted ml-auto flex items-center gap-3 rounded-full p-1 pr-2 sm:ml-0">
                                <Avatar name={user.name} size="sm" status="online" />
                                <span className="hidden text-left leading-tight xl:block">
                                    <span className="block text-sm font-medium">Hey, {user.name.split(' ')[0]}</span>
                                    <span className="text-muted-foreground block text-xs">{user.email}</span>
                                </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem icon={<Settings />} onSelect={() => router.visit('/admin/settings')}>
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem icon={<LogOut />} variant="destructive" onSelect={logout}>
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>

                    <Head title={heading} />
                    {children}
                </main>
            </div>
        </ToastProvider>
    );
}
