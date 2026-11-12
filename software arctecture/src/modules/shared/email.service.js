const { Resend } = require('resend');
require('dotenv').config();

const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const emailFromName = process.env.EMAIL_FROM_NAME || 'EasyFood';

const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Função para padronizar o conteúdo HTML dos e-mails
 */
function buildHtml({ header, body, footer }) {
  return `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
<h2>${header}</h2>
<div>${body}</div>
<hr />
<p style="color: #888; font-size: 12px;">
${footer}
</p>
</div>
`;
}

/**
 * Função genérica e reutilizável para envio de e-mails via Resend.
 * @param {Object} params
 * @param {string} params.to - e-mail do destinatário
 * @param {string} [params.toName] - nome do destinatário
 * @param {string} params.subject - assunto do e-mail
 * @param {string} params.header - título dentro do e-mail
 * @param {string} params.body - conteúdo principal
 * @param {string} params.footer - encerramento
 */
async function sendEmail({
  to,
  toName,
  subject,
  header,
  body,
  footer
}) {
  const html = buildHtml({
    header,
    body,
    footer
  });

  const text = `${header}\n\n${(body || '').replace(/<[^>]*>?/gm, '')}\n\n${footer}`;
  const sender = emailFromName ? `${emailFromName} <${emailFrom}>` : emailFrom;

  if (!apiKey || !resend) {
    console.warn(
      `[EMAIL] Simulado: Enviado para ${to} - "${subject}" (Configure RESEND_API_KEY no .env para envio real)`
    );
    return {
      success: true,
      simulated: true,
      to,
      subject
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: sender,
      to: [to],
      subject: subject,
      html: html,
      text: text,
    });

    if (error) {
      console.error('[Resend Error]', error);
      throw new Error(`Resend Error: ${error.message}`);
    }

    console.log(
      `[EMAIL] Enviado para ${to} - "${subject}"`
    );

    return {
      success: true,
      data
    };
  } catch (err) {
    console.error(`[EMAIL] Falha no disparo de e-mail para ${to}:`, err.message);
    throw err;
  }
}

module.exports = {
  sendEmail,
  buildHtml
};
