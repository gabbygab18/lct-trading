<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class Order extends Model
{
    public const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

    public const SHIPPING = [
        'courier'  => 'Standard courier (Gogo Express), 3–10 days',
        'lalamove' => 'Same-day Lalamove, Metro Manila only',
        'cargo'    => 'Cargo, freight collect (AP Cargo or your forwarder)',
        'local'    => 'LCT local delivery',
    ];

    public const PAYMENT = [
        'cod'  => 'Cash on delivery',
        'bank' => 'Bank deposit',
    ];

    protected $fillable = [
        'reference', 'status', 'customer_name', 'phone', 'email', 'fulfilment',
        'address', 'address_line2', 'barangay', 'city', 'region', 'postal_code',
        'shipping_preference', 'payment_preference', 'notes', 'subtotal', 'item_count',
    ];

    protected $casts = [
        'subtotal'          => 'decimal:2',
        'item_count'        => 'integer',
        'stock_deducted_at' => 'datetime',
        'is_read'           => 'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** LCT-260924-7KQ3: the date for staff, a random tail so it can't be guessed. */
    public static function newReference(): string
    {
        // No 0/O, 1/I/L: the reference gets read out over the phone.
        $alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        do {
            $tail = collect(range(1, 4))->map(fn () => $alphabet[random_int(0, strlen($alphabet) - 1)])->implode('');
            $ref = 'LCT-'.now()->format('ymd').'-'.$tail;
        } while (static::where('reference', $ref)->exists());

        return $ref;
    }

    public function fullAddress(): ?string
    {
        if ($this->fulfilment !== 'ship') {
            return null;
        }

        return collect([
            $this->address,
            $this->address_line2,
            $this->barangay ? 'Brgy. '.$this->barangay : null,
            $this->city,
            $this->region,
            $this->postal_code,
        ])->filter()->implode(', ');
    }

    /**
     * Move the order to a new status. Confirming takes the stock out;
     * cancelling an order that took stock puts it back.
     *
     * @throws RuntimeException when confirming would take stock below zero
     */
    public function transitionTo(string $status): void
    {
        DB::transaction(function () use ($status) {
            $order = static::whereKey($this->id)->lockForUpdate()->firstOrFail();
            $order->load('items');

            $deduct = in_array($status, ['confirmed', 'completed'], true) && ! $order->stock_deducted_at;
            $restore = $status === 'cancelled' && $order->stock_deducted_at;

            if ($deduct) {
                $products = Product::whereIn('id', $order->items->pluck('product_id')->filter())
                    ->lockForUpdate()->get()->keyBy('id');

                $short = $order->items
                    ->filter(fn ($i) => isset($products[$i->product_id]) && $products[$i->product_id]->stock < $i->quantity)
                    ->map(fn ($i) => "{$i->sku} (need {$i->quantity}, have {$products[$i->product_id]->stock})");

                if ($short->isNotEmpty()) {
                    throw new RuntimeException('Not enough stock for '.$short->implode(', ').'. Update the stock count first, or adjust the order with the customer.');
                }

                foreach ($order->items as $item) {
                    if (isset($products[$item->product_id])) {
                        $products[$item->product_id]->decrement('stock', $item->quantity);
                    }
                }
                $order->stock_deducted_at = now();
            }

            if ($restore) {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        Product::whereKey($item->product_id)->increment('stock', $item->quantity);
                    }
                }
                $order->stock_deducted_at = null;
            }

            $order->status = $status;
            $order->save();
            $this->setRawAttributes($order->getAttributes(), true);
        });
    }
}
