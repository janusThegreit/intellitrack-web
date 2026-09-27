<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetLinkMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public string $resetUrl;
    public int $expiresInMinutes;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $resetUrl, int $expiresInMinutes = 60)
    {
        $this->user = $user;
        $this->resetUrl = $resetUrl;
        $this->expiresInMinutes = $expiresInMinutes;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Your Account Password | IntelliTrack IAM',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset-link',
        );
    }
}
