{{--
    Plain HTML of the page for crawlers and AI assistants that don't run
    JavaScript. Built from the same props React gets, so it says exactly what
    the page shows. React clears it on load (visitors see it only for the
    moment before the app starts).
--}}
@php
    $p = $page['props'];
    $peso = fn ($n) => '₱'.number_format((float) $n, 2);
    $brandUrl = fn ($b) => route('brand', \Illuminate\Support\Str::slug($b));
    $catUrl = fn ($c) => route('category', \Illuminate\Support\Str::slug($c));
@endphp
<div class="lct-fallback">
    <nav aria-label="Main">
        <a href="{{ route('home') }}">LCT Trading</a> ·
        <a href="{{ route('catalog') }}">Shop</a> ·
        <a href="{{ route('how-to-order') }}">How to order</a> ·
        <a href="{{ route('contact') }}">Contact</a>
    </nav>

    @switch($page['component'])
        @case('Privacy')
            <h1>Privacy policy</h1>
            <p>Last updated {{ $p['updated'] }}</p>
            @foreach ($p['sections'] as [$title, $paragraphs])
                <h2>{{ $title }}</h2>
                @foreach ($paragraphs as $text)
                    <p>{{ $text }}</p>
                @endforeach
            @endforeach
            <h2>Contact us</h2>
            <p>{{ $p['settings']['email'] ?? '' }} {{ $p['settings']['phone'] ?? '' }}</p>
            @break

        @case('Home')
            <h1>Tools and hardware, ordered in minutes.</h1>
            <p>{{ number_format($p['stats']['items']) }} items from {{ $p['stats']['brands'] }} brands. Find it by SKU, see the price and stock, send the order. LCT Trading confirms by phone; pay cash on delivery or by bank deposit.</p>
            <h2>Shop by category</h2>
            <ul>
                @foreach ($p['categories'] as $c)
                    <li><a href="{{ $catUrl($c['name']) }}">{{ $c['name'] }}</a> ({{ number_format($c['count']) }} items)</li>
                @endforeach
            </ul>
            <h2>Brands</h2>
            <ul>
                @foreach ($p['brands'] as $b)
                    <li><a href="{{ $brandUrl($b['name']) }}">{{ $b['name'] }}</a></li>
                @endforeach
            </ul>
            @break

        @case('Catalog')
            <h1>{{ $p['filters']['q'] !== '' ? 'Search: '.$p['filters']['q'] : ($p['intro']['heading'] ?? trim($p['filters']['brand'].' '.($p['filters']['category'] ?: ($p['filters']['brand'] ? '' : 'Tools & hardware')))) }}</h1>
            <p>{{ number_format($p['products']['total']) }} items · page {{ $p['products']['current_page'] }} of {{ $p['products']['last_page'] }}@if (! empty($p['intro'])) · updated {{ $p['intro']['updated'] }}@endif</p>
            @if (! empty($p['intro']))<p>{{ $p['intro']['text'] }}</p>@endif
            <ul>
                @foreach ($p['products']['data'] as $item)
                    <li>
                        <a href="{{ $item['url'] }}">{{ $item['name'] }}</a>
                        · SKU {{ $item['sku'] }} · {{ $item['brand'] }} · {{ $peso($item['price']) }}
                        · {{ $item['stock'] > 0 ? 'In stock' : 'Out of stock' }}
                    </li>
                @endforeach
            </ul>
            @if ($p['products']['next_page_url'])
                <a href="{{ $p['products']['next_page_url'] }}" rel="next">Next page</a>
            @endif
            @if (! empty($p['intro']))
                <h2>Questions</h2>
                @foreach ($p['intro']['faqs'] as $f)
                    <h3>{{ $f['q'] }}</h3>
                    <p>{{ $f['a'] }}</p>
                @endforeach
            @endif
            <h2>Categories</h2>
            <ul>
                @foreach ($p['categories'] as $c)
                    <li><a href="{{ $catUrl($c['name']) }}">{{ $c['name'] }}</a></li>
                @endforeach
            </ul>
            @break

        @case('Product')
            @php($item = $p['product'])
            <nav aria-label="Breadcrumb">
                <a href="{{ route('catalog') }}">Shop</a> ›
                <a href="{{ $brandUrl($item['brand']) }}">{{ $item['brand'] }}</a>
                @if ($item['category']) › <a href="{{ $catUrl($item['category']) }}">{{ $item['category'] }}</a> @endif
            </nav>
            <h1>{{ $item['name'] }}</h1>
            @if ($item['image'])
                <img src="{{ $item['image'] }}" alt="{{ $item['name'] }}" width="400" height="400">
            @endif
            <dl>
                <dt>SKU</dt><dd>{{ $item['sku'] }}</dd>
                <dt>Brand</dt><dd>{{ $item['brand'] }}</dd>
                @if ($item['type'])<dt>Type</dt><dd>{{ $item['type'] }}</dd>@endif
                <dt>Price</dt><dd>{{ $peso($item['price']) }}@if ($item['listPrice']) (was {{ $peso($item['listPrice']) }}, {{ $item['discount'] }}% off)@endif</dd>
                <dt>Availability</dt><dd>{{ $item['stock'] > 0 ? 'In stock' : 'Out of stock' }}</dd>
            </dl>
            <div>{!! $item['description'] !!}</div>
            @if (count($p['related']))
                <h2>Similar items</h2>
                <ul>
                    @foreach ($p['related'] as $r)
                        <li><a href="{{ $r['url'] }}">{{ $r['name'] }}</a> · {{ $peso($r['price']) }}</li>
                    @endforeach
                </ul>
            @endif
            @break

        @case('HowToOrder')
            <h1>How to order from LCT Trading</h1>
            <ol>
                <li>Find it: search by name or SKU, or browse by brand and category.</li>
                <li>Add to tray: set the quantity, then send the tray with your contact and address.</li>
                <li>We call to confirm: LCT checks stock and calls or texts you with the total and delivery fee.</li>
            </ol>
            <h2>Delivery</h2>
            <ul>@foreach ($p['shipping'] as $s)<li>{{ $s }}</li>@endforeach</ul>
            <h2>Payment</h2>
            <ul>@foreach ($p['payment'] as $s)<li>{{ $s }}</li>@endforeach</ul>
            <h2>Common questions</h2>
            @foreach ($p['faqs'] as $f)
                <h3>{{ $f['q'] }}</h3>
                <p>{{ $f['a'] }}</p>
            @endforeach
            @break

        @case('Contact')
            @php($store = \App\Support\Seo::store())
            <h1>Contact LCT Trading</h1>
            <p>Ask about an item, a bulk order or delivery. Send the SKU or a photo, and we'll check stock and get back to you with the total.</p>
            <ul>
                @if ($store['phone'])<li>Phone: {{ $store['phone'] }}</li>@endif
                @if ($store['email'])<li>Email: {{ $store['email'] }}</li>@endif
                @if ($store['address'])<li>Store and pickup: {{ $store['address'] }}</li>@endif
                @if ($store['hours'])<li>Hours: {{ $store['hours'] }}</li>@endif
            </ul>
            @break

        @default
            <h1>{{ $seo->title }}</h1>
    @endswitch
</div>
