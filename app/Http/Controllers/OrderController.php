<?php

namespace App\Http\Controllers;

use App\Mail\OrderReceived;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class OrderController extends Controller
{
    /**
     * The tray link carries the product ids, so the slip shows today's
     * price and stock rather than whatever was cached in the browser.
     */
    public function checkout(Request $request): Response
    {
        $ids = collect(explode(',', (string) $request->query('ids')))
            ->map(fn ($id) => (int) $id)->filter()->unique()->take(200);

        $fresh = Product::active()->whereIn('id', $ids)->get()
            ->mapWithKeys(fn (Product $p) => [$p->id => CatalogController::card($p)]);

        return Inertia::render('Checkout', [
            'fresh'    => $ids->isEmpty() ? null : $fresh,
            'shipping' => Order::SHIPPING,
            'payment'  => Order::PAYMENT,
            'regions'  => self::REGIONS,
        ]);
    }

    /**
     * The cart lives in the visitor's browser, so this endpoint trusts only
     * product ids and quantities from it: names, SKUs and prices are read
     * fresh from the database.
     */
    public function store(Request $request): RedirectResponse
    {
        // Bots fill every field; people never see this one.
        if (filled($request->input('company_website'))) {
            return redirect()->route('catalog');
        }

        $max = config('catalog.max_quantity');
        $data = $request->validate([
            'items'               => ['required', 'array', 'min:1', 'max:200'],
            'items.*.id'          => ['required', 'integer'],
            'items.*.quantity'    => ['required', 'integer', 'min:1', "max:{$max}"],
            'customer_name'       => ['required', 'string', 'max:120'],
            'phone'               => ['required', 'string', 'max:30', 'regex:/^[0-9+()\-\s]{7,}$/'],
            'email'               => ['nullable', 'email', 'max:190'],
            'fulfilment'          => ['required', Rule::in(['ship', 'pickup'])],
            'address'             => ['required_if:fulfilment,ship', 'nullable', 'string', 'max:190'],
            'address_line2'       => ['nullable', 'string', 'max:190'],
            'barangay'            => ['required_if:fulfilment,ship', 'nullable', 'string', 'max:120'],
            'city'                => ['required_if:fulfilment,ship', 'nullable', 'string', 'max:120'],
            'region'              => ['required_if:fulfilment,ship', 'nullable', Rule::in(self::REGIONS)],
            'postal_code'         => ['nullable', 'string', 'max:10'],
            'shipping_preference' => ['required_if:fulfilment,ship', 'nullable', Rule::in(array_keys(Order::SHIPPING))],
            'payment_preference'  => ['required', Rule::in(array_keys(Order::PAYMENT))],
            'notes'               => ['nullable', 'string', 'max:1000'],
        ], [
            'customer_name.required' => 'Enter your name so we know who to ask for.',
            'phone.required'       => 'Enter a number we can call or text to confirm.',
            'phone.regex'          => 'Enter a mobile or landline number we can call, e.g. 0917 123 4567.',
            'email.email'          => 'That email doesn’t look right. Leave it blank if you prefer.',
            '*.required_if'        => 'Needed for delivery.',
            'items.required'       => 'Your tray is empty.',
        ]);

        $quantities = collect($data['items'])->groupBy('id')->map(fn ($lines) => $lines->sum('quantity'));
        $products = Product::active()->whereIn('id', $quantities->keys())->get()->keyBy('id');

        $problems = [];
        foreach ($quantities as $id => $qty) {
            $product = $products[$id] ?? null;
            if (! $product) {
                $problems[] = 'An item in your tray is no longer listed. Remove it and try again.';
            } elseif ($product->stock <= 0) {
                $problems[] = "{$product->sku} is out of stock. Remove it from your tray to continue.";
            }
        }
        if ($problems) {
            throw ValidationException::withMessages(['items' => array_values(array_unique($problems))]);
        }

        $order = DB::transaction(function () use ($data, $quantities, $products) {
            $lines = $quantities->map(fn ($qty, $id) => [
                'product_id' => $id,
                'sku'        => $products[$id]->sku,
                'name'       => $products[$id]->name,
                'brand'      => $products[$id]->brand,
                'price'      => $products[$id]->salePrice(),
                'list_price' => $products[$id]->hasDiscount() ? $products[$id]->price : null,
                'quantity'   => $qty,
                'line_total' => round($products[$id]->salePrice() * $qty, 2),
            ])->values();

            $isShip = $data['fulfilment'] === 'ship';
            $order = Order::create([
                'reference'           => Order::newReference(),
                'status'              => 'pending',
                'customer_name'       => $data['customer_name'],
                'phone'               => $data['phone'],
                'email'               => $data['email'] ?? null,
                'fulfilment'          => $data['fulfilment'],
                'address'             => $isShip ? $data['address'] : null,
                'address_line2'       => $isShip ? ($data['address_line2'] ?? null) : null,
                'barangay'            => $isShip ? $data['barangay'] : null,
                'city'                => $isShip ? $data['city'] : null,
                'region'              => $isShip ? $data['region'] : null,
                'postal_code'         => $isShip ? ($data['postal_code'] ?? null) : null,
                'shipping_preference' => $isShip ? $data['shipping_preference'] : null,
                'payment_preference'  => $data['payment_preference'],
                'notes'               => $data['notes'] ?? null,
                'subtotal'            => $lines->sum('line_total'),
                'item_count'          => $lines->sum('quantity'),
            ]);
            $order->items()->createMany($lines->all());

            return $order;
        });

        $this->notifyStore($order);

        // Only the browser that placed the order can open its receipt.
        $request->session()->push('placed_orders', $order->reference);

        return redirect()->route('orders.placed', $order->reference);
    }

    public function placed(Request $request, string $reference): Response
    {
        abort_unless(in_array($reference, $request->session()->get('placed_orders', []), true), 404);

        $order = Order::with('items')->where('reference', $reference)->firstOrFail();

        return Inertia::render('OrderPlaced', [
            'order' => [
                'reference'   => $order->reference,
                'name'        => $order->customer_name,
                'phone'       => $order->phone,
                'fulfilment'  => $order->fulfilment,
                'address'     => $order->fullAddress(),
                'shipping'    => Order::SHIPPING[$order->shipping_preference] ?? null,
                'payment'     => Order::PAYMENT[$order->payment_preference] ?? $order->payment_preference,
                'subtotal'    => (float) $order->subtotal,
                'item_count'  => $order->item_count,
                'placed_at'   => $order->created_at->timezone('Asia/Manila')->format('M j, Y · g:i A'),
                'items'       => $order->items->map(fn ($i) => [
                    'sku'        => $i->sku,
                    'name'       => $i->name,
                    'quantity'   => $i->quantity,
                    'price'      => (float) $i->price,
                    'list_price' => $i->list_price ? (float) $i->list_price : null,
                    'line_total' => (float) $i->line_total,
                ]),
            ],
        ]);
    }

    private function notifyStore(Order $order): void
    {
        $recipient = Setting::get('email') ?: config('mail.orders_to');
        if (blank($recipient)) {
            return;
        }

        try {
            // Queued so the customer's confirmation never waits on SMTP.
            Mail::to($recipient)->queue(new OrderReceived($order));
        } catch (Throwable $e) {
            // The order is saved and visible in the admin either way.
            Log::error('Order notification failed to queue', [
                'order'     => $order->reference,
                'recipient' => $recipient,
                'error'     => $e->getMessage(),
            ]);
        }
    }

    public const REGIONS = [
        'Metro Manila', 'Cordillera (CAR)', 'Ilocos Region', 'Cagayan Valley', 'Central Luzon',
        'CALABARZON', 'MIMAROPA', 'Bicol Region', 'Western Visayas', 'Negros Island Region',
        'Central Visayas', 'Eastern Visayas', 'Zamboanga Peninsula', 'Northern Mindanao',
        'Davao Region', 'SOCCSKSARGEN', 'Caraga', 'BARMM',
    ];
}
