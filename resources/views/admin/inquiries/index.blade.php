@extends('admin.layout')

@section('title', 'Inquiries')
@section('heading', 'Inquiries')
@section('sub', 'Messages from the contact form on the homepage. Newest first.')

@section('content')
    <div class="a-card overflow-x-auto">
        <table class="a-table min-w-[720px]">
            <thead>
                <tr><th>From</th><th>Topic</th><th>Message</th><th>Received</th></tr>
            </thead>
            <tbody>
                @forelse ($inquiries as $q)
                    <tr>
                        <td>
                            <a href="{{ route('admin.inquiries.show', $q) }}" class="font-semibold {{ $q->is_read ? '' : 'text-signal' }}">{{ $q->name }}</a>
                            <div class="text-[12.5px] text-steel-700">{{ $q->phone }}</div>
                        </td>
                        <td class="whitespace-nowrap">{{ $q->topicLabel() }}</td>
                        <td class="max-w-[420px]"><div class="line-clamp-2">{{ $q->message }}</div></td>
                        <td class="whitespace-nowrap text-[13px] text-steel-700">{{ $q->created_at->timezone('Asia/Manila')->format('M j, g:i A') }}</td>
                    </tr>
                @empty
                    <tr><td colspan="4" class="py-12 text-center text-steel-700">No inquiries yet. Messages from the homepage contact form land here.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-4">{{ $inquiries->links('admin.pagination') }}</div>
@endsection
