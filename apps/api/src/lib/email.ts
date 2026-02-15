/**
 * Email Service
 * Handles all transactional email sending
 * Uses Resend for email delivery
 */

import { logger } from './logger.js';
import { brand } from './brand.js';

// ─── Types ───────────────────────────────────────────────────

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Configuration ───────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || brand.fromEmail;
const FRONTEND_URL = brand.frontendUrl;

// ─── Email Templates ─────────────────────────────────────────

function getVerificationEmailTemplate(
  clinicName: string,
  verificationUrl: string,
  language: 'fr' | 'ar' = 'fr'
): { subject: string; html: string; text: string } {
  if (language === 'ar') {
    return {
      subject: `تأكيد بريدك الإلكتروني - ${brand.name}`,
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 32px; }
    .btn { display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>مرحباً بك في ${brand.name}!</h1>
    </div>
    <div class="content">
      <p>مرحباً ${clinicName}،</p>
      <p>شكراً لتسجيلك في ${brand.name}. يرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه:</p>
      <p style="text-align: center;">
        <a href="${verificationUrl}" class="btn">تأكيد البريد الإلكتروني</a>
      </p>
      <p>هذا الرابط صالح لمدة 24 ساعة.</p>
      <p>إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة.</p>
    </div>
    <div class="footer">
      <p>© ${brand.name} - نظام إدارة طابور العيادة</p>
    </div>
  </div>
</body>
</html>`,
      text: `مرحباً ${clinicName}،\n\nشكراً لتسجيلك في ${brand.name}. يرجى تأكيد بريدك الإلكتروني عبر هذا الرابط:\n${verificationUrl}\n\nهذا الرابط صالح لمدة 24 ساعة.\n\nفريق ${brand.name}`,
    };
  }

  // French (default)
  return {
    subject: `Confirmez votre email - ${brand.name}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 32px; }
    .btn { display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bienvenue sur ${brand.name}!</h1>
    </div>
    <div class="content">
      <p>Bonjour ${clinicName},</p>
      <p>Merci de vous être inscrit sur ${brand.name}. Veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous:</p>
      <p style="text-align: center;">
        <a href="${verificationUrl}" class="btn">Confirmer mon email</a>
      </p>
      <p>Ce lien est valide pendant 24 heures.</p>
      <p>Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email.</p>
    </div>
    <div class="footer">
      <p>© ${brand.name} - Gestion de file d'attente pour cabinets médicaux</p>
    </div>
  </div>
</body>
</html>`,
    text: `Bonjour ${clinicName},\n\nMerci de vous être inscrit sur ${brand.name}. Veuillez confirmer votre email en visitant ce lien:\n${verificationUrl}\n\nCe lien est valide pendant 24 heures.\n\nL'équipe ${brand.name}`,
  };
}

function getPasswordResetEmailTemplate(
  clinicName: string,
  resetUrl: string,
  language: 'fr' | 'ar' = 'fr'
): { subject: string; html: string; text: string } {
  if (language === 'ar') {
    return {
      subject: `إعادة تعيين كلمة المرور - ${brand.name}`,
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 32px; }
    .btn { display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; margin: 16px 0; }
    .footer { padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>إعادة تعيين كلمة المرور</h1>
    </div>
    <div class="content">
      <p>مرحباً ${clinicName}،</p>
      <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="btn">إعادة تعيين كلمة المرور</a>
      </p>
      <div class="warning">
        <strong>⚠️ هام:</strong> هذا الرابط صالح لمدة ساعة واحدة فقط.
      </div>
      <p>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.</p>
    </div>
    <div class="footer">
      <p>© ${brand.name} - نظام إدارة طابور العيادة</p>
    </div>
  </div>
</body>
</html>`,
      text: `مرحباً ${clinicName}،\n\nلقد طلبت إعادة تعيين كلمة المرور الخاصة بك. استخدم هذا الرابط:\n${resetUrl}\n\nهذا الرابط صالح لمدة ساعة واحدة فقط.\n\nفريق ${brand.name}`,
    };
  }

  // French (default)
  return {
    subject: `Réinitialisation de mot de passe - ${brand.name}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 32px; }
    .btn { display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; margin: 16px 0; }
    .footer { padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Réinitialisation de mot de passe</h1>
    </div>
    <div class="content">
      <p>Bonjour ${clinicName},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe</a>
      </p>
      <div class="warning">
        <strong>⚠️ Important:</strong> Ce lien n'est valide que pendant 1 heure.
      </div>
      <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
    </div>
    <div class="footer">
      <p>© ${brand.name} - Gestion de file d'attente pour cabinets médicaux</p>
    </div>
  </div>
</body>
</html>`,
    text: `Bonjour ${clinicName},\n\nVous avez demandé la réinitialisation de votre mot de passe. Utilisez ce lien:\n${resetUrl}\n\nCe lien n'est valide que pendant 1 heure.\n\nL'équipe ${brand.name}`,
  };
}

function getWelcomeEmailTemplate(
  clinicName: string,
  language: 'fr' | 'ar' = 'fr'
): { subject: string; html: string; text: string } {
  const dashboardUrl = `${FRONTEND_URL}/dashboard`;

  if (language === 'ar') {
    return {
      subject: `مرحباً بك في ${brand.name} - ابدأ فترتك التجريبية!`,
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin-top: 12px; }
    .content { padding: 32px; }
    .feature { display: flex; align-items: flex-start; margin: 16px 0; }
    .feature-icon { font-size: 24px; margin-left: 12px; }
    .btn { display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 تم تأكيد حسابك!</h1>
      <div class="badge">30 يوم تجربة مجانية</div>
    </div>
    <div class="content">
      <p>مرحباً ${clinicName}،</p>
      <p>حسابك جاهز! لديك 30 يوماً لاختبار جميع ميزات ${brand.name} مجاناً.</p>

      <h3>ماذا يمكنك فعله الآن:</h3>
      <div class="feature">
        <span class="feature-icon">📋</span>
        <span>إدارة طابور مرضاك بسهولة</span>
      </div>
      <div class="feature">
        <span class="feature-icon">📱</span>
        <span>مشاركة رمز QR مع مرضاك</span>
      </div>
      <div class="feature">
        <span class="feature-icon">📊</span>
        <span>متابعة مباشرة للمرضى على هواتفهم</span>
      </div>

      <p style="text-align: center;">
        <a href="${dashboardUrl}" class="btn">الذهاب إلى لوحة التحكم</a>
      </p>
    </div>
    <div class="footer">
      <p>أسئلة؟ راسلنا على ${brand.supportEmail}</p>
      <p>© ${brand.name} - نظام إدارة طابور العيادة</p>
    </div>
  </div>
</body>
</html>`,
      text: `مرحباً ${clinicName}،\n\nحسابك جاهز! لديك 30 يوماً لاختبار جميع ميزات ${brand.name} مجاناً.\n\nابدأ الآن: ${dashboardUrl}\n\nفريق ${brand.name}`,
    };
  }

  // French (default)
  return {
    subject: `Bienvenue sur ${brand.name} - Votre essai gratuit commence!`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin-top: 12px; }
    .content { padding: 32px; }
    .feature { display: flex; align-items: flex-start; margin: 16px 0; }
    .feature-icon { font-size: 24px; margin-right: 12px; }
    .btn { display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Votre compte est confirmé!</h1>
      <div class="badge">30 jours d'essai gratuit</div>
    </div>
    <div class="content">
      <p>Bonjour ${clinicName},</p>
      <p>Votre compte est prêt! Vous avez 30 jours pour tester toutes les fonctionnalités de ${brand.name} gratuitement.</p>

      <h3>Ce que vous pouvez faire maintenant:</h3>
      <div class="feature">
        <span class="feature-icon">📋</span>
        <span>Gérer la file d'attente de vos patients</span>
      </div>
      <div class="feature">
        <span class="feature-icon">📱</span>
        <span>Partager votre QR code avec vos patients</span>
      </div>
      <div class="feature">
        <span class="feature-icon">📊</span>
        <span>Suivi en temps réel pour vos patients sur leur téléphone</span>
      </div>

      <p style="text-align: center;">
        <a href="${dashboardUrl}" class="btn">Accéder au tableau de bord</a>
      </p>
    </div>
    <div class="footer">
      <p>Des questions? Contactez-nous à ${brand.supportEmail}</p>
      <p>© ${brand.name} - Gestion de file d'attente pour cabinets médicaux</p>
    </div>
  </div>
</body>
</html>`,
    text: `Bonjour ${clinicName},\n\nVotre compte est prêt! Vous avez 30 jours pour tester toutes les fonctionnalités de ${brand.name} gratuitement.\n\nCommencez maintenant: ${dashboardUrl}\n\nL'équipe ${brand.name}`,
  };
}

function getTrialExpiringEmailTemplate(
  clinicName: string,
  daysRemaining: number,
  language: 'fr' | 'ar' = 'fr'
): { subject: string; html: string; text: string } {
  const subscriptionUrl = `${FRONTEND_URL}/subscription`;
  const headerBg = daysRemaining <= 3 ? '#ef4444' : '#f59e0b';

  if (language === 'ar') {
    return {
      subject: `تنبيه: يتبقى ${daysRemaining} أيام في فترتك التجريبية - ${brand.name}`,
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; direction: rtl; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
  .header { background: ${headerBg}; padding: 32px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .content { padding: 32px; }
  .btn { display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
  .footer { padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>يتبقى ${daysRemaining} أيام في فترتك التجريبية</h1></div>
    <div class="content">
      <p>مرحباً ${clinicName}،</p>
      <p>فترتك التجريبية في ${brand.name} ستنتهي خلال <strong>${daysRemaining} أيام</strong>.</p>
      <p>اشترك الآن للاستمرار في إدارة طابور مرضاك.</p>
      <p style="text-align: center;"><a href="${subscriptionUrl}" class="btn">اشترك الآن</a></p>
    </div>
    <div class="footer"><p>© ${brand.name}</p></div>
  </div>
</body>
</html>`,
      text: `مرحباً ${clinicName}،\n\nفترتك التجريبية في ${brand.name} ستنتهي خلال ${daysRemaining} أيام.\n\nاشترك الآن: ${subscriptionUrl}\n\nفريق ${brand.name}`,
    };
  }

  return {
    subject: `Rappel : il reste ${daysRemaining} jours d'essai - ${brand.name}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
  .header { background: ${headerBg}; padding: 32px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .content { padding: 32px; }
  .btn { display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
  .footer { padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Il reste ${daysRemaining} jours d'essai</h1></div>
    <div class="content">
      <p>Bonjour ${clinicName},</p>
      <p>Votre essai gratuit de ${brand.name} se termine dans <strong>${daysRemaining} jours</strong>.</p>
      <p>Abonnez-vous maintenant pour continuer à gérer votre file d'attente.</p>
      <p style="text-align: center;"><a href="${subscriptionUrl}" class="btn">S'abonner maintenant</a></p>
    </div>
    <div class="footer"><p>© ${brand.name}</p></div>
  </div>
</body>
</html>`,
    text: `Bonjour ${clinicName},\n\nVotre essai gratuit de ${brand.name} se termine dans ${daysRemaining} jours.\n\nAbonnez-vous : ${subscriptionUrl}\n\nL'équipe ${brand.name}`,
  };
}

function getFirstMorningEmailTemplate(
  doctorName: string,
  language: 'fr' | 'ar' = 'fr'
): { subject: string; html: string; text: string } {
  const dashboardUrl = `${FRONTEND_URL}/dashboard`;

  if (language === 'ar') {
    return {
      subject: `${doctorName}، كل شيء جاهز لغداً - ${brand.name}`,
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; direction: rtl; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .content { padding: 32px; line-height: 1.8; }
  .checklist { background: #f0fdfa; border-radius: 8px; padding: 20px; margin: 24px 0; }
  .checklist-item { padding: 8px 0; display: flex; align-items: center; gap: 8px; }
  .checklist-num { width: 24px; height: 24px; border-radius: 50%; background: #059669; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .btn { display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
  .footer { padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>كل شيء جاهز لغداً 🎉</h1></div>
    <div class="content">
      <p>مرحباً ${doctorName}،</p>
      <p>عيادتك جاهزة لاستقبال المرضى رقمياً. إليك قائمة سريعة لصباحك الأول:</p>
      <div class="checklist">
        <div class="checklist-item"><span class="checklist-num">1</span> علّق ملصق رمز QR في غرفة الانتظار</div>
        <div class="checklist-item"><span class="checklist-num">2</span> أول مريض يسجّل عبر الماسح</div>
        <div class="checklist-item"><span class="checklist-num">3</span> نادِ أول مريض من لوحة التحكم</div>
      </div>
      <p>هذا كل شيء! ثلاث خطوات بسيطة وأنت تعمل.</p>
      <p style="text-align: center;"><a href="${dashboardUrl}" class="btn">فتح لوحة التحكم</a></p>
    </div>
    <div class="footer"><p>بالتوفيق غداً!<br>فريق ${brand.name}</p></div>
  </div>
</body>
</html>`,
      text: `مرحباً ${doctorName}،\n\nعيادتك جاهزة! إليك قائمة صباحك الأول:\n\n1. علّق ملصق QR في غرفة الانتظار\n2. أول مريض يسجّل عبر الماسح\n3. نادِ أول مريض من لوحة التحكم\n\nفتح لوحة التحكم: ${dashboardUrl}\n\nبالتوفيق!\nفريق ${brand.name}`,
    };
  }

  return {
    subject: `${doctorName}, tout est prêt pour demain - ${brand.name}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .content { padding: 32px; line-height: 1.8; }
  .checklist { background: #f0fdfa; border-radius: 8px; padding: 20px; margin: 24px 0; }
  .checklist-item { padding: 8px 0; display: flex; align-items: center; gap: 8px; }
  .checklist-num { width: 24px; height: 24px; border-radius: 50%; background: #059669; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .btn { display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
  .footer { padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Tout est prêt pour demain 🎉</h1></div>
    <div class="content">
      <p>Bonjour ${doctorName},</p>
      <p>Votre cabinet est configuré et prêt à accueillir des patients numériquement. Voici votre checklist pour demain matin :</p>
      <div class="checklist">
        <div class="checklist-item"><span class="checklist-num">1</span> Affichez le poster QR dans votre salle d'attente</div>
        <div class="checklist-item"><span class="checklist-num">2</span> Votre premier patient s'enregistre en scannant</div>
        <div class="checklist-item"><span class="checklist-num">3</span> Appelez votre premier patient depuis le tableau de bord</div>
      </div>
      <p>C'est tout ! Trois étapes simples et vous êtes opérationnel.</p>
      <p style="text-align: center;"><a href="${dashboardUrl}" class="btn">Ouvrir mon tableau de bord</a></p>
    </div>
    <div class="footer"><p>Bonne chance pour demain !<br>L'équipe ${brand.name}</p></div>
  </div>
</body>
</html>`,
    text: `Bonjour ${doctorName},\n\nVotre cabinet est prêt ! Voici votre checklist pour demain :\n\n1. Affichez le poster QR dans la salle d'attente\n2. Votre premier patient s'enregistre en scannant\n3. Appelez votre premier patient depuis le tableau de bord\n\nOuvrir le tableau de bord : ${dashboardUrl}\n\nBonne chance !\nL'équipe ${brand.name}`,
  };
}

// ─── Email Sending ───────────────────────────────────────────

/**
 * Send an email using Resend API
 */
async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // If no API key, log and skip (useful for development)
  if (!RESEND_API_KEY) {
    logger.info({ to: options.to, subject: options.subject }, 'No RESEND_API_KEY configured, skipping email');
    return { success: true, messageId: 'dev-mode-skipped' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      logger.error({ err: error }, 'Email failed to send');
      return { success: false, error: error.message || 'Unknown error' };
    }

    const result = await response.json() as { id?: string };
    logger.info({ messageId: result.id }, 'Email sent successfully');
    return { success: true, messageId: result.id };
  } catch (error) {
    logger.error({ err: error }, 'Email send error');
    return { success: false, error: (error as Error).message };
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Send verification email to newly registered clinic
 */
export async function sendVerificationEmail(
  email: string,
  clinicName: string,
  verificationToken: string,
  language: 'fr' | 'ar' = 'fr'
): Promise<EmailResult> {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const template = getVerificationEmailTemplate(clinicName, verificationUrl, language);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  clinicName: string,
  resetToken: string,
  language: 'fr' | 'ar' = 'fr'
): Promise<EmailResult> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  const template = getPasswordResetEmailTemplate(clinicName, resetUrl, language);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send welcome email after email verification
 */
export async function sendWelcomeEmail(
  email: string,
  clinicName: string,
  language: 'fr' | 'ar' = 'fr'
): Promise<EmailResult> {
  const template = getWelcomeEmailTemplate(clinicName, language);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send trial expiration warning email
 */
export async function sendTrialExpiringEmail(
  email: string,
  clinicName: string,
  daysRemaining: number,
  language: 'fr' | 'ar' = 'fr'
): Promise<EmailResult> {
  const template = getTrialExpiringEmailTemplate(clinicName, daysRemaining, language);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send "first morning" email after onboarding completion
 */
export async function sendFirstMorningEmail(
  email: string,
  doctorName: string,
  language: 'fr' | 'ar' = 'fr'
): Promise<EmailResult> {
  const template = getFirstMorningEmailTemplate(doctorName, language);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
