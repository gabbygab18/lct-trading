<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inquiry extends Model
{
    public const TOPICS = [
        'product'   => 'Question about an item',
        'bulk'      => 'Bulk or project order',
        'quotation' => 'Request a quotation',
        'other'     => 'Something else',
    ];

    protected $fillable = ['name', 'phone', 'email', 'topic', 'message'];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function topicLabel(): string
    {
        return self::TOPICS[$this->topic] ?? $this->topic;
    }
}
