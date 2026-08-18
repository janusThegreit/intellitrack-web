<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intellitrack AI Interface</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 class="text-2xl font-bold mb-4 text-blue-600">Intellitrack AI Assistant</h1>

        @if(session('error'))
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {{ session('error') }}
            </div>
        @endif

        <form action="{{ route('ai.ask') }}" method="POST" class="mb-6">
            @csrf
            <div class="mb-4">
                <label for="prompt" class="block font-medium mb-1">Itanong sa AI:</label>
                <textarea name="prompt" id="prompt" rows="3" class="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Halimbawa: Paano mag-analyze ng workforce entry data?" required>{{ old('prompt') }}</textarea>
            </div>
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Send Prompt</button>
        </form>

        @if(session('ai_response'))
            <div class="bg-gray-50 border p-4 rounded-md">
                <h3 class="font-bold text-gray-800 mb-2">Sagot ng AI:</h3>
                <p class="whitespace-pre-line text-gray-700">{{ session('ai_response') }}</p>
            </div>
        @endif
    </div>
</body>
</html>