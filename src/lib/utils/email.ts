import nodemailer from 'nodemailer'
import { escapeHtml } from './sanitize'
import { getSocialLinks, SITE_URL } from '@/lib/config'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

function generateEmailFooter(): string {
  const socialLinks = getSocialLinks()
  const displayUrl = SITE_URL.replace(/^https?:\/\//, '')
  
  const socialLinksHtml = socialLinks.length > 0 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        <tr>
          <td align="center">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">Retrouvez-moi sur :</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                ${socialLinks.map((link, index) => `
                  <td style="padding: 0 8px;">
                    <a href="${link.href}" style="display: inline-block; color: #4F46E5; text-decoration: none; font-size: 14px;">
                      ${link.icon} ${link.label}
                    </a>
                  </td>
                  ${index < socialLinks.length - 1 ? '<td style="color: #d1d5db;">|</td>' : ''}
                `).join('')}
              </tr>
            </table>
          </td>
        </tr>
      </table>
  ` : ''

  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      ${socialLinksHtml}
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin: 0;">
        Cet email a été envoyé automatiquement depuis <a href="${SITE_URL}" style="color: #4F46E5;">${displayUrl}</a>
      </p>
    </div>
  `
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('SMTP not configured, skipping email')
    return false
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export function generateIdeaCompletedEmail(
  username: string,
  ideaTitle: string,
  ideaUrl: string,
  links: { platform: string; url: string }[]
): string {
  const safeUsername = escapeHtml(username)
  const safeTitle = escapeHtml(ideaTitle)
  const safeUrl = escapeHtml(ideaUrl)
  
  const linksHtml = links.length > 0 
    ? `
      <p style="margin-top: 20px;"><strong>Liens vers le contenu :</strong></p>
      <ul style="margin: 10px 0;">
        ${links.map(l => `<li><a href="${escapeHtml(l.url)}" style="color: #4F46E5;">${escapeHtml(l.platform)}: ${escapeHtml(l.url)}</a></li>`).join('')}
      </ul>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Bonne nouvelle !</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Bonjour <strong>${safeUsername}</strong>,</p>
        
        <p>Votre suggestion a été réalisée !</p>
        
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 18px;">${safeTitle}</h2>
          <span style="display: inline-block; background: #10B981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">✓ Terminé</span>
        </div>

        ${linksHtml}
        
        <p style="margin-top: 20px;">
          <a href="${safeUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">Voir la suggestion</a>
        </p>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          Merci d'avoir contribué à Idées !
        </p>
        
        ${generateEmailFooter()}
      </div>
    </body>
    </html>
  `
}

export function generateFollowedIdeaCompletedEmail(
  username: string,
  ideaTitle: string,
  ideaUrl: string,
  links: { platform: string; url: string }[]
): string {
  const safeUsername = escapeHtml(username)
  const safeTitle = escapeHtml(ideaTitle)
  const safeUrl = escapeHtml(ideaUrl)
  
  const linksHtml = links.length > 0 
    ? `
      <p style="margin-top: 20px;"><strong>Liens vers le contenu :</strong></p>
      <ul style="margin: 10px 0;">
        ${links.map(l => `<li><a href="${escapeHtml(l.url)}" style="color: #4F46E5;">${escapeHtml(l.platform)}: ${escapeHtml(l.url)}</a></li>`).join('')}
      </ul>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Suggestion terminée !</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Bonjour <strong>${safeUsername}</strong>,</p>
        
        <p>Une suggestion que vous suivez a été réalisée !</p>
        
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 18px;">${safeTitle}</h2>
          <span style="display: inline-block; background: #10B981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">✓ Terminé</span>
        </div>

        ${linksHtml}
        
        <p style="margin-top: 20px;">
          <a href="${safeUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">Voir le contenu</a>
        </p>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          Vous recevez cet email car vous suivez cette suggestion.
        </p>
        
        ${generateEmailFooter()}
      </div>
    </body>
    </html>
  `
}
