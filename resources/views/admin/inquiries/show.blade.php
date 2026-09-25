@extends('admin.layout')

@section('title', 'Inquiry from '.$inquiry->name)
@section('heading', $inquiry->name)
@section('sub', $inquiry->topicLabel().' · '.$inquiry->created_at->timezone('Asia/Manila')->format('D, M j, Y · g:i A'))

@section('content')
    <div class="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
        <div class="a-card p-6 text-[15px] leading-relaxed whitespace-pre-line">{{ $inquiry->message }}</div>

        <aside class="space-y-4">
            <div class="a-card space-y-2 p-5 text-[14px]">
                <a href="tel:{{ preg_replace('/[^0-9+]/', '', $inquiry->phone) }}" class="font-display block text-[20px] font-bold text-signal">{{ $inquiry->phone }}</a>
                @if ($inquiry->email)
                    <a href="mailto:{{ $inquiry->email }}" class="block underline">{{ $inquiry->email }}</a>
                @endif
            </div>
            <form action="{{ route('admin.inquiries.destroy', $inquiry) }}" method="POST" onsubmit="return confirm('Delete this inquiry?');">
                @csrf
                @method('DELETE')
                <button class="text-[13px] text-steel-700 underline hover:text-signal-600">Delete this inquiry</button>
            </form>
        </aside>
    </div>
@endsection
