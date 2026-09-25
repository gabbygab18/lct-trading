@extends('admin.layout')

@section('title', 'Add item')
@section('heading', 'Add item')

@section('content')
    <form action="{{ route('admin.products.store') }}" method="POST" enctype="multipart/form-data">
        @csrf
        @include('admin.products._form')
    </form>
@endsection
