<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #111827; border-radius: 16px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #f2b600 0%, #fbbf24 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              <div style="display: inline-block; padding: 8px 16px; background-color: rgba(242, 182, 0, 0.1); border-radius: 8px; border: 1px solid rgba(242, 182, 0, 0.2); margin-bottom: 16px;">
                <span style="font-size: 13px; font-weight: 700; color: #f2b600; letter-spacing: 1px; text-transform: uppercase;">IntelliTrack IAM Gateway</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Sign-In Verification Code</h1>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 0 32px 24px 32px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Hello <strong style="color: #ffffff;">{{ $user->name }}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                We received a sign-in attempt for your account (<span style="color: #cbd5e1; font-family: monospace;">{{ $user->email }}</span>). Use the One-Time Password (OTP) below to authenticate your session:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 24px 16px; margin: 0 0 24px 0; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 8px;">
                  Your 6-Digit OTP Code
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #f2b600; text-indent: 10px;">
                  {{ $otp }}
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
                  Expires in <strong style="color: #e2e8f0;">{{ $expiresInMinutes }} minutes</strong>
                </div>
              </div>

              <!-- Security Notice -->
              <div style="background-color: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; border-radius: 6px; padding: 12px 14px; text-align: left; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #fca5a5; line-height: 1.5;">
                  <strong>Security Alert:</strong> Never share this code with anyone, including IntelliTrack or Alibaton staff. If you did not initiate this request, please contact your administrator or change your password immediately.
                </p>
              </div>

              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                This code can only be used once. After {{ $expiresInMinutes }} minutes, it will expire and a new one will be required.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px 32px; border-top: 1px solid #1f2937; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569;">
                &copy; {{ date('Y') }} Alibaton Construction Inc. &bull; IntelliTrack Operations
              </p>
              <p style="margin: 0; font-size: 10px; color: #334155;">
                Automated Identity & Access Management (IAM) notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
