import { Resend } from "resend";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "ClinicFlow <onboarding@resend.dev>";

export async function sendVerificationEmail(to: string, token: string, baseUrl: string) {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  const resend = getResend();

  if (!resend) {
    console.log(`[EMAIL] Verification link for ${to}: ${verifyUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "ClinicFlow - Vérifiez votre email",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e293b;">Bienvenue sur ClinicFlow</h2>
        <p style="color: #475569;">Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte.</p>
        <a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Vérifier mon email
        </a>
        <p style="color: #94a3b8; font-size: 14px;">Ce lien expire dans 24 heures.</p>
        <p style="color: #94a3b8; font-size: 12px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string, baseUrl: string) {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const resend = getResend();

  if (!resend) {
    console.log(`[EMAIL] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "ClinicFlow - Réinitialisation du mot de passe",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e293b;">Réinitialisation du mot de passe</h2>
        <p style="color: #475569;">Vous avez demandé la réinitialisation de votre mot de passe ClinicFlow.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Réinitialiser mon mot de passe
        </a>
        <p style="color: #94a3b8; font-size: 14px;">Ce lien expire dans 1 heure.</p>
        <p style="color: #94a3b8; font-size: 12px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      </div>
    `,
  });
}
