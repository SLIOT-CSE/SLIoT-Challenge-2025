import nodemailer from "nodemailer";
import type { EmailConfig } from "../env";
import type { SendEmail } from "./worker";

// nodemailer over Google Workspace SMTP with the app password (docs/architecture.md, section 7).
// Port 465 uses TLS from the start; 587 upgrades with STARTTLS. Only this file changes if the
// provider ever does.

export function createSmtpSender(config: EmailConfig): SendEmail {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port !== 465,
    auth: { user: config.user, pass: config.password },
  });
  return async ({ to, subject, html, text }) => {
    await transport.sendMail({ from: config.from, to, subject, html, text });
  };
}
