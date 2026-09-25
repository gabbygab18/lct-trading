@if ($paginator->hasPages())
    <nav class="flex flex-wrap items-center gap-1.5" aria-label="Pages">
        @if (! $paginator->onFirstPage())
            <a href="{{ $paginator->previousPageUrl() }}" class="a-btn a-btn-ghost a-btn-sm">Prev</a>
        @endif
        @foreach ($elements as $element)
            @if (is_string($element))
                <span class="px-1 text-steel-700">…</span>
            @endif
            @if (is_array($element))
                @foreach ($element as $page => $url)
                    @if ($page == $paginator->currentPage())
                        <span aria-current="page" class="a-btn a-btn-sm bg-foam-800 text-white">{{ $page }}</span>
                    @else
                        <a href="{{ $url }}" class="a-btn a-btn-ghost a-btn-sm">{{ $page }}</a>
                    @endif
                @endforeach
            @endif
        @endforeach
        @if ($paginator->hasMorePages())
            <a href="{{ $paginator->nextPageUrl() }}" class="a-btn a-btn-ghost a-btn-sm">Next</a>
        @endif
        <span class="ml-2 text-[13px] text-steel-700">{{ number_format($paginator->firstItem()) }}–{{ number_format($paginator->lastItem()) }} of {{ number_format($paginator->total()) }}</span>
    </nav>
@endif
