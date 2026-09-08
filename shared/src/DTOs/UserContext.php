<?php

namespace IntelliTrack\Shared\DTOs;

class UserContext
{
    public function __construct(
        public readonly int $id,
        public readonly string $email,
        public readonly string $name,
        public readonly string $role,
        public readonly array $permissions = []
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: (int) ($data['id'] ?? 0),
            email: (string) ($data['email'] ?? ''),
            name: (string) ($data['name'] ?? ''),
            role: (string) ($data['role'] ?? 'customer'),
            permissions: (array) ($data['permissions'] ?? [])
        );
    }

    public static function fromRequest(): ?self
    {
        $userId = request()->header('X-User-Id');
        if (! $userId) {
            return null;
        }

        return new self(
            id: (int) $userId,
            email: (string) request()->header('X-User-Email', ''),
            name: (string) request()->header('X-User-Name', ''),
            role: (string) request()->header('X-User-Role', 'customer'),
            permissions: explode(',', (string) request()->header('X-User-Permissions', ''))
        );
    }

    public function toHeaders(): array
    {
        return [
            'X-User-Id' => (string) $this->id,
            'X-User-Email' => $this->email,
            'X-User-Name' => $this->name,
            'X-User-Role' => $this->role,
            'X-User-Permissions' => implode(',', $this->permissions),
        ];
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'name' => $this->name,
            'role' => $this->role,
            'permissions' => $this->permissions,
        ];
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['administrator', 'admin']);
    }

    public function isSalesManager(): bool
    {
        return in_array($this->role, ['sales_manager', 'manager']);
    }

    public function isSalesBd(): bool
    {
        return in_array($this->role, ['sales_business_development', 'sales_bd']);
    }

    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }
}
