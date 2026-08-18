<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->only(['id', 'name', 'email', 'first_name', 'last_name', 'nickname', 'phone', 'avatar_url', 'role', 'last_login_at']));
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'nickname' => ['nullable', 'string', 'max:60'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $request->user()->update($data);

        return response()->json($request->user()->fresh()->only(['id', 'name', 'email', 'first_name', 'last_name', 'nickname', 'phone', 'avatar_url', 'role', 'last_login_at']));
    }

    public function updateAvatar(Request $request)
    {
        $data = $request->validate(['avatar' => ['required', 'image', 'max:2048']]);
        $user = $request->user();

        if ($user->avatar_url && str_starts_with($user->avatar_url, '/storage/')) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $user->avatar_url));
        }

        $path = $data['avatar']->store('avatars', 'public');
        $user->update(['avatar_url' => '/storage/'.$path]);

        return response()->json(['avatar_url' => $user->avatar_url]);
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $request->user()->update(['password' => Hash::make($data['password'])]);

        return response()->json(['message' => 'Password updated.']);
    }
}