<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AiController extends Controller
{
    public function index()
    {
        return redirect()->route('ai-analytics');
    }

    public function askAi(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string|max:1000',
        ]);

        abort(410, 'The legacy AI endpoint has been retired. Use the authenticated AI Copilot on the Data Analysis page.');
    }
}