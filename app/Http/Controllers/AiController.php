<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    public function index()
    {
        return view('ai.index');
    }

    public function askAi(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string',
        ]);

        try {
            // I-send ang HTTP Request sa Python FastAPI service (Port 8001)
            $response = Http::post('http://127.0.0.1:8001/api/generate', [
                'prompt' => $request->input('prompt'),
            ]);

            if ($response->successful()) {
                $result = $response->json('response');
                return back()->with('ai_response', $result)->withInput();
            }

            return back()->with('error', 'PAGSUBOK: Nag-error ang AI service.')->withInput();
        } catch (\Exception $e) {
            return back()->with('error', 'Hindi maabot ang AI service. Siguraduhing nakatakbo ang FastAPI server sa port 8001.')->withInput();
        }
    }
}