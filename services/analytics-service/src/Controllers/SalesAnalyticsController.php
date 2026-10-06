<?php

namespace IntelliTrack\Services\Analytics\Controllers;

use Illuminate\Routing\Controller;

class SalesAnalyticsController extends Controller
{
    public function summary()
    {
        return response()->json([
            'message' => 'Analytics data is served by the authenticated application analytics API; no analytics dataset is configured in this service.',
        ], 503);
    }
}
