@extends('admin.layout')

@section('title', $product->sku)
@section('heading', $product->sku)
@section('sub', $product->is_placeholder ? 'Sample item. Saving it makes it one of LCT’s own.' : 'Last changed '.$product->updated_at->timezone('Asia/Manila')->diffForHumans())

@section('content')
    <form action="{{ route('admin.products.update', $product) }}" method="POST" enctype="multipart/form-data">
        @csrf
        @method('PUT')
        <input type="hidden" name="back" value="{{ request('back') }}">
        @include('admin.products._form')
    </form>

    <form action="{{ route('admin.products.destroy', $product) }}" method="POST" class="mt-10 border-t border-steel-300 pt-6"
        onsubmit="return confirm('Delete {{ $product->sku }}? Past orders keep their copy of it.');">
        @csrf
        @method('DELETE')
        <button class="a-btn a-btn-ghost !text-signal-600">Delete this item</button>
        <span class="ml-2 text-[13px] text-steel-700">To hide it for now instead, untick “Show in the catalog”.</span>
    </form>
@endsection
