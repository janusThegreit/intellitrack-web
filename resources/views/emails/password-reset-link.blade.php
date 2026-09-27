<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #111827; border-radius: 16px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #f2b600 0%, #fbbf24 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              <div style="display: inline-block; padding: 8px 16px; background-color: rgba(242, 182, 0, 0.1); border-radius: 8px; border: 1px solid rgba(242, 182, 0, 0.2); margin-bottom: 16px;">
                <span style="font-size: 13px; font-weight: 700; color: #f2b600; letter-spacing: 1px; text-transform: uppercase;">IntelliTrack Security Gateway</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Password Reset Request</h1>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 0 32px 24px 32px; text-align: left;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
                Hello <strong style="color: #ffffff;">{{ $user->name }}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                We received a request to change the password for your IntelliTrack account (<span style="color: #f2b600; font-family: monospace;">{{ $user->email }}</span>).
              </p>
              <p style="margin: 0 0 28px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Click the secure button below to set a new password. This single-use link is valid for <strong>{{ $expiresInMinutes }} minutes</strong>:
              </p>

              <!-- Reset Password CTA Button -->
              <div style="text-align: center; margin: 0 0 28px 0;">
                <a href="{{ $resetUrl }}"
                   style="display: inline-block; background-color: #f2b600; color: #0f172a; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 14px rgba(242, 182, 0, 0.35); text-transform: uppercase; letter-spacing: 0.5px;"
                   target="_blank">
                  Reset My Password
                </a>
              </div>

              <!-- Security Notice -->
              <div style="background-color: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; border-radius: 6px; padding: 12px 14px; text-align: left; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #93c5fd; line-height: 1.5;">
                  <strong>Enterprise Audit Notice:</strong> For compliance and governance, your system administrator is automatically alerted whenever a password reset is requested and completed.
                </p>
              </div>

              <!-- Fallback Link -->
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                If the button above does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin: 0 0 20px 0; font-size: 11px; color: #f2b600; word-break: break-all; font-family: monospace; background: #0f172a; padding: 10px; border-radius: 6px; border: 1px solid #1e293b;">
                {{ $resetUrl }}
              </p>

              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                If you did not request a password reset, you can safely disregard this email. Your current password remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px 32px; border-top: 1px solid #1f2937; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569;">
                &copy; {{ date('Y') }} Alibaton Construction Inc. &bull; IntelliTrack Identity & Access Management
              </p>
              <p style="margin: 0; font-size: 10px; color: #334155;">
                Automated security notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
