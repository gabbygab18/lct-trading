<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>Admin log in · LCT Trading</title>
    <link rel="icon" href="{{ asset('favicon.ico') }}" sizes="any">
    @vite(['resources/css/app.css'])
</head>

<body class="grid min-h-dvh place-items-center px-4">
    <main class="w-full max-w-[380px]">
        <div class="mb-6 flex items-center gap-3">
            <img src="{{ asset('images/lct-mark.webp') }}" alt="" class="h-14 w-auto">
            <div class="leading-none">
                <div class="font-cond text-[28px] font-extrabold text-steel-50">LCT TRADING</div>
                <div class="mt-1.5 border-t-2 border-signal pt-1 font-cond text-[11px] font-semibold uppercase tracking-[0.32em] text-steel-400">Admin</div>
            </div>
        </div>

        <form action="{{ route('admin.login.attempt') }}" method="POST" class="plate space-y-4 rounded-[6px] p-6">
            @csrf
            <h1 class="stamp text-[22px]">Log in</h1>
            @if ($errors->any())
                <p class="rounded-[3px] bg-signal-soft px-3 py-2 text-[14px] font-medium text-signal-700" role="alert">{{ $errors->first() }}</p>
            @endif
            <div>
                <label for="email" class="a-label">Email</label>
                <input type="email" id="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username" class="a-input">
            </div>
            <div>
                <label for="password" class="a-label">Password</label>
                <input type="password" id="password" name="password" required autocomplete="current-password" class="a-input">
            </div>
            <label class="flex items-center gap-2 text-[14px]">
                <input type="checkbox" name="remember" value="1" class="size-4 accent-[#d7141a]"> Keep me logged in on this device
            </label>
            <button type="submit" class="a-btn a-btn-primary w-full">Log in</button>
        </form>
    </main>
</body>

</html>
