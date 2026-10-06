<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'first_name', 'last_name', 'nickname', 'phone', 'avatar_url', 'role', 'client_id', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the user's created job orders
     */
    public function createdJobOrders(): HasMany
    {
        return $this->hasMany(JobOrder::class, 'created_by');
    }

    /**
     * Get the user's assigned job orders
     */
    public function assignedJobOrders(): HasMany
    {
        return $this->hasMany(JobOrder::class, 'assigned_to');
    }

    /**
     * Get the user's created quotations
     */
    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class, 'created_by');
    }

    /**
     * Get the user's managed projects
     */
    public function managedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'project_manager_id');
    }

    /**
     * Get the user's assigned tasks
     */
    public function assignedTasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class, 'assigned_to');
    }

    /**
     * Get the user's activity logs
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Get the user's notifications
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get the user's uploaded attachments
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class, 'uploaded_by');
    }

    /**
     * Get the user's assigned maintenance records
     */
    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(EquipmentMaintenance::class, 'assigned_to');
    }

    /**
     * Check if user has super admin role
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Check if user has administrator role
     */
    public function isAdministrator(): bool
    {
        return in_array($this->role, ['super_admin', 'admin', 'administrator']);
    }

    /**
     * Check if user has sales manager role
     */
    public function isSalesManager(): bool
    {
        return $this->role === 'sales_manager' || $this->role === 'manager';
    }

    /**
     * Check if user has sales business development role
     */
    public function isSalesBusinessDevelopment(): bool
    {
        return $this->role === 'sales_business_development' || $this->role === 'sales_bd';
    }

    /**
     * Backward compatibility for previous role names
     */
    public function isAdmin(): bool
    {
        return $this->isAdministrator();
    }

    /**
     * Backward compatibility for previous role names
     */
    public function isManager(): bool
    {
        return $this->isSalesManager();
    }

    /**
     * Check if user has client role
     */
    public function isClient(): bool
    {
        return in_array($this->role, ['client', 'customer']);
    }

    /**
     * Check if user has customer role (alias for client)
     */
    public function isCustomer(): bool
    {
        return $this->isClient();
    }

    /**
     * Check if user is an internal enterprise employee
     */
    public function isInternalUser(): bool
    {
        return !$this->isClient();
    }

    /**
     * Check if user has operations & technical staff role
     */
    public function isOperationsTechnical(): bool
    {
        return in_array($this->role, [
            'operations_technical',
            'operations_staff',
            'technical_staff',
            'staff',
        ]);
    }

    /**
     * Check if user has staff role
     */
    public function isStaff(): bool
    {
        return $this->isOperationsTechnical();
    }

    /**
     * Associated customer/client record for client users
     */
    public function client(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Customer::class, 'client_id');
    }

    /**
     * Get user's full name
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}") ?: $this->name;
    }
}
