import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not defined in environment variables")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
export const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || FROM_EMAIL

// Email sending wrapper with error handling
export async function sendEmail(options: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("[EMAIL] Skipping email send - no API key configured")
      console.log(`[EMAIL] Would send: ${options.subject} to ${options.to}`)
      return { success: false, error: "No API key configured" }
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      console.error("[EMAIL] Failed to send email:", error)
      return { success: false, error: error.message }
    }

    console.log("[EMAIL] Email sent successfully:", data?.id)
    return { success: true, data }
  } catch (error: any) {
    console.error("[EMAIL] Unexpected error sending email:", error)
    return { success: false, error: error.message }
  }
}
