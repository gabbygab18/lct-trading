import { Checkbox } from '@/components/glint/checkbox';
import { Eye, EyeOff, Icon, LoaderCircle } from '@/icons';
import { Head, useForm } from '@inertiajs/react';
import { useState, type FormEventHandler, type ReactNode } from 'react';

const STEPS = ['Log in with your admin account', 'Confirm orders and answer inquiries', 'Keep prices and stock right'];

const field =
    'h-12 w-full rounded-xl border border-transparent bg-[#f4f4f2] px-4 text-[15px] text-[#1b1b1d] outline-none transition placeholder:text-[#a8abaf] focus:border-[#d7141a]/40 focus:bg-white focus:ring-4 focus:ring-[#d7141a]/10';
const label = 'mb-2 block text-sm font-semibold';

/** lct-stocks' AuthSplitLayout: brand gradient with the steps on the left, the form on the right. */
function AuthLayout({ children, title }: { children: ReactNode; title: string }) {
    return (
        <div className="flex min-h-svh items-center justify-center bg-[#1f1f21] p-3 sm:p-6 lg:p-10">
            {/* .light keeps the card readable when the device is in dark mode. */}
            <div className="light grid w-full max-w-6xl overflow-hidden rounded-[1.75rem] bg-white p-2 text-[#1b1b1d] shadow-2xl lg:grid-cols-2 lg:rounded-[2.25rem]">
                <aside className="relative flex min-h-56 flex-col overflow-hidden rounded-[1.4rem] bg-[radial-gradient(circle_at_28%_22%,#ff9a9a_0%,transparent_42%),radial-gradient(circle_at_80%_75%,#ff4d55_0%,transparent_48%),linear-gradient(155deg,#a50d12_0%,#d7141a_45%,#5c0609_100%)] p-6 text-white sm:p-8 lg:min-h-[640px] lg:rounded-[1.9rem] lg:p-11">
                    <a href="/" className="flex items-center gap-2.5">
                        <img src="/images/lct-mark.webp" alt="" className="size-9 object-contain" />
                        <span className="text-lg font-semibold tracking-tight">LCT Trading</span>
                    </a>

                    <div className="mt-auto pt-10">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur">
                            Shop Admin <Icon name="store" className="size-4" />
                        </span>
                        <h2 className="mt-5 text-4xl leading-[1.02] font-black sm:text-5xl lg:text-6xl">Welcome back</h2>
                        <p className="mt-4 text-white/80">Orders, items and prices for lcttrading.com, in one place.</p>

                        <ol className="mt-8 hidden grid-cols-3 gap-3 sm:grid">
                            {STEPS.map((step, i) => (
                                <li
                                    key={step}
                                    className={
                                        i === 0
                                            ? 'flex min-h-36 flex-col rounded-2xl bg-white p-4 text-[#1b1b1d]'
                                            : 'flex min-h-36 flex-col rounded-2xl border border-white/20 bg-white/15 p-4 text-white/85 backdrop-blur'
                                    }
                                >
                                    <span
                                        className={
                                            i === 0
                                                ? 'grid size-7 place-items-center rounded-full bg-[#d7141a] text-sm font-semibold text-white'
                                                : 'grid size-7 place-items-center rounded-full border border-white/60 text-sm'
                                        }
                                    >
                                        {i + 1}
                                    </span>
                                    <span className="mt-auto text-sm leading-snug font-medium">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </aside>

                <main className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
                    <div className="w-full max-w-sm">
                        <h1 className="text-center text-3xl font-black sm:text-4xl">{title}</h1>
                        <div className="mt-9">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ email: '', password: '', remember: false });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/login', { onFinish: () => reset('password') });
    };

    return (
        <AuthLayout title="Admin login">
            <Head title="Log in" />

            <form className="grid gap-6" onSubmit={submit}>
                <div>
                    <label htmlFor="email" className={label}>
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        autoFocus
                        autoComplete="username"
                        placeholder="you@lcttrading.com"
                        className={field}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && <p className="mt-2 text-sm text-[#b80f14]">{errors.email}</p>}
                </div>

                <div>
                    <label htmlFor="password" className={label}>
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            placeholder="••••••••••"
                            className={`${field} pr-12`}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#a8abaf] transition-colors hover:text-[#1b1b1d]"
                        >
                            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-2 text-sm text-[#b80f14]">{errors.password}</p>}
                </div>

                <Checkbox
                    id="remember"
                    label={<span className="text-sm">Keep me logged in on this device</span>}
                    checked={data.remember}
                    onChange={(e) => setData('remember', e.target.checked)}
                />

                <button
                    type="submit"
                    disabled={processing}
                    className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#d7141a] text-base font-semibold text-white shadow-[0_10px_24px_-10px_#d7141a] transition hover:bg-[#b80f14] focus-visible:ring-4 focus-visible:ring-[#d7141a]/25 focus-visible:outline-none disabled:opacity-70"
                >
                    {processing && <LoaderCircle className="size-5 animate-spin" />}
                    Continue
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#55585c]">No account yet? Ask your administrator to create one.</p>
            <p className="mt-10 text-center text-xs text-[#8e9196]">
                LCT Trading · Tools &amp; Hardware Supply ·{' '}
                <a href="/" className="font-medium text-[#d7141a] hover:underline">
                    lcttrading.com
                </a>
            </p>
        </AuthLayout>
    );
}

// Not inside the admin shell.
Login.layout = (page: ReactNode) => page;
