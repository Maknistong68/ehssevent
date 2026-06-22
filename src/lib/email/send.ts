import 'server-only'

export interface EmailMessage {
  to: string
  subject: string
  body: string
}

/**
 * Mock email sender. In the current phase this only logs the message to the
 * server console so flows that "notify by email" are observable in the demo.
 *
 * TODO(prod): replace with a real transactional email provider (SMTP / API),
 * with templating, retries and delivery logging.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  console.info(
    `[email:mock] to=${message.to} subject="${message.subject}"\n${message.body}`
  )
}
