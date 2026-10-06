<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use IntelliTrack\Services\Auth\Models\User;
use RuntimeException;

class AuthServiceTestUsersSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            throw new RuntimeException('Development authentication test users cannot be seeded in production.');
        }

        // Uses the existing DatabaseSeeder development password convention.
        $accounts = [
            ['name' => 'IntelliTrack Admin Test', 'email' => 'admin@intellitrack.com', 'role' => 'admin', 'is_active' => true],
            ['name' => 'IntelliTrack Sales Manager Test', 'email' => 'salesmanager@intellitrack.com', 'role' => 'sales_manager', 'is_active' => true],
            ['name' => 'IntelliTrack Sales BD Test', 'email' => 'salesbd@intellitrack.com', 'role' => 'sales_business_development', 'is_active' => true],
            ['name' => 'IntelliTrack Client Test', 'email' => 'client@intellitrack.test', 'role' => 'client', 'is_active' => true],
            ['name' => 'IntelliTrack Inactive Client Test', 'email' => 'inactive-client@intellitrack.test', 'role' => 'client', 'is_active' => false],
        ];

        if (! User::where('role', 'super_admin')->exists()) {
            User::create([
                'name' => 'IntelliTrack Super Admin Test',
                'email' => 'superadmin@intellitrack.test',
                'role' => 'super_admin',
                'is_active' => true,
                'password' => Hash::make('password'),
            ]);
        }

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    ...$account,
                    'password' => Hash::make('password'),
                ]
            );
        }
    }
}
