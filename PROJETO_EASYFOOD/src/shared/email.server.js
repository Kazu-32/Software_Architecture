require("dotenv").config();

/**
 * Serviço compartilhado de envio de e-mails integrado à API REST do MailerSend.
 * Não conhece detalhes de banco de dados nem de controllers específicos.
 */
class EmailService {
  constructor() {
    this.apiKey = process.env.MAILERSEND_API_KEY;
    this.senderEmail =
      process.env.MAILERSEND_SENDER_EMAIL ||
      "No-Reply@test-ywj2lpn385qg7oqz.mlsender.net";
    this.senderName = process.env.MAILERSEND_SENDER_NAME || "Easy Food";
  }

  /**
   * Envia um e-mail através da API REST do MailerSend.
   * @param {Object} options
   * @param {Array<{email: string, name?: string}>|string} options.recipients - Destinatário(s)
   * @param {string} options.subject - Assunto da mensagem
   * @param {string} options.html - Corpo em HTML
   * @param {string} [options.text] - Versão em texto puro (opcional)
   */
  async sendEmail({ recipients, subject, html, text }) {
    const apiKey = process.env.MAILERSEND_API_KEY || this.apiKey;
    const senderEmail = process.env.MAILERSEND_SENDER_EMAIL || this.senderEmail;
    const senderName = process.env.MAILERSEND_SENDER_NAME || this.senderName;

    if (!apiKey) {
      console.warn(
        "[EmailService] MAILERSEND_API_KEY não configurada no .env. E-mail simulado com sucesso.",
      );
      return {
        success: true,
        simulated: true,
        message:
          "Variável MAILERSEND_API_KEY ausente. Configure no .env para envio real.",
      };
    }

    // Normaliza para o formato exigido pelo MailerSend: [{ email, name }]
    const rawList = Array.isArray(recipients) ? recipients : [recipients];
    const formattedRecipients = rawList
      .map((r) => {
        if (typeof r === "string") return { email: r.trim(), name: "" };
        return {
          email: r.email ? r.email.trim() : "",
          name: r.name ? r.name.trim() : "",
        };
      })
      .filter((r) => r.email.length > 0);

    if (formattedRecipients.length === 0) {
      throw new Error("[EmailService] Nenhum destinatário válido fornecido.");
    }

    const payload = {
      from: {
        email: senderEmail,
        name: senderName,
      },
      to: formattedRecipients,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ""),
    };

    try {
      const response = await fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "[EmailService] Erro na resposta do MailerSend:",
          errorData,
        );
        throw new Error(
          `MailerSend API Error (${response.status}): ${JSON.stringify(errorData)}`,
        );
      }

      console.log(
        `[EmailService] E-mail enviado com sucesso para ${formattedRecipients.length} destinatário(s).`,
      );
      return { success: true, count: formattedRecipients.length };
    } catch (error) {
      console.error(
        "[EmailService] Falha no disparo de e-mail:",
        error.message,
      );
      throw error;
    }
  }
}

module.exports = new EmailService();
