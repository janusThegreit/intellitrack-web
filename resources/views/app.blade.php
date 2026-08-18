<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="IntelliTrack - Professional Heavy Equipment Rental & Project Management System">
    
    <title inertia>{{ config('app.name', 'IntelliTrack') }}</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet">
    
    <!-- Styles -->
    @viteReactRefresh
    @vite('resources/css/app.css')
    
    <!-- Inertia Head -->
    @inertiaHead
  </head>
  <body class="font-sans antialiased bg-neutral-50">
    @inertia
    
    <!-- Scripts -->
    @vite('resources/js/app.tsx')
  </body>
</html>
