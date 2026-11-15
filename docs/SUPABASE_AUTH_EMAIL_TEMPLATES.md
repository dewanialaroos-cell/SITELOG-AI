# SITELOG AI — Supabase Auth email templates

These templates are bilingual (Arabic first, English second). Apply them in the Supabase Dashboard under **Authentication → Email Templates**. They are not deployed automatically by the frontend repository.

Set the Supabase **Site URL** to the production SITELOG AI URL and add the production URL plus its password-reset callback URL to the Redirect URLs allow-list before testing.

## Confirm signup

**Subject:** تأكيد حساب SITELOG AI | Confirm your SITELOG AI account

```html
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172b42;line-height:1.8">
  <div style="background:#102540;padding:24px;color:#ffcf70;font-size:22px;font-weight:bold">SITELOG AI</div>
  <div style="padding:28px;border:1px solid #e3e9f1">
    <h2 dir="rtl" style="color:#102540">مرحباً بك في SITELOG AI</h2>
    <p dir="rtl">شكراً لإنشاء حسابك. يرجى تأكيد بريدك الإلكتروني لتفعيل حسابك.</p>
    <p dir="rtl"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#f4a51c;color:#172b42;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">تأكيد البريد الإلكتروني</a></p>
    <hr style="border:0;border-top:1px solid #e3e9f1;margin:26px 0">
    <h2 style="color:#102540">Welcome to SITELOG AI</h2>
    <p>Thank you for creating an account. Please confirm your email address to activate your account.</p>
    <p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#f4a51c;color:#172b42;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Confirm email address</a></p>
  </div>
</div>
```

## Invite user

**Subject:** دعوة للانضمام إلى SITELOG AI | You are invited to SITELOG AI

```html
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172b42;line-height:1.8">
  <div style="background:#102540;padding:24px;color:#ffcf70;font-size:22px;font-weight:bold">SITELOG AI</div>
  <div style="padding:28px;border:1px solid #e3e9f1">
    <h2 dir="rtl">تمت دعوتك للانضمام إلى مساحة عمل SITELOG AI</h2>
    <p dir="rtl">لقد دعاك مسؤول الشركة للانضمام إلى فريق العمل. افتح الرابط أدناه لإكمال إعداد حسابك.</p>
    <p dir="rtl"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#f4a51c;color:#172b42;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">قبول الدعوة</a></p>
    <hr style="border:0;border-top:1px solid #e3e9f1;margin:26px 0">
    <h2>You are invited to SITELOG AI</h2>
    <p>Your company administrator invited you to join the team. Use the link below to finish setting up your account.</p>
    <p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#f4a51c;color:#172b42;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Accept invitation</a></p>
  </div>
</div>
```

## Reset password

**Subject:** إعادة تعيين كلمة المرور | Reset your SITELOG AI password

```html
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172b42;line-height:1.8">
  <div style="background:#102540;padding:24px;color:#ffcf70;font-size:22px;font-weight:bold">SITELOG AI</div>
  <div style="padding:28px;border:1px solid #e3e9f1">
    <h2 dir="rtl">إعادة تعيين كلمة المرور</h2>
    <p dir="rtl">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.</p>
    <p dir="rtl"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#f4a51c;color:#172b42;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">تعيين كلمة مرور جديدة</a></p>
    <hr style="border:0;border-top:1px solid #e3e9f1;margin:26px 0">
    <h2>Reset your password</h2>
    <p>We received a request to reset your account password. If you did not request this, you can ignore this email.</p>
    <p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#f4a51c;color:#172b42;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Choose a new password</a></p>
  </div>
</div>
```

## Important implementation note

The frontend password-reset action uses Supabase Auth's `resetPasswordForEmail` method. The password-reset email template must be saved in Supabase Dashboard for the email itself to become bilingual.

The current frontend calls a Supabase Edge Function named `invite-engineer`, but the production branch does not currently contain that function source. Do not consider engineer invitation email delivery complete until a secure server-side function is deployed and verified. Never put the Supabase service-role key in frontend code.
