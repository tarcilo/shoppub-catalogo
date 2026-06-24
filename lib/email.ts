// Envio do magic link. Em produção usa o Resend (RESEND_API_KEY/RESEND_FROM).
// Sem chave (dev), imprime o link no console — dá pra testar o fluxo sem e-mail.

export async function sendMagicLink(email: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "catalogo@shoppub.io";

  if (!apiKey) {
    console.log(`\n[magic-link] (dev) link para ${email}:\n${url}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Seu acesso ao painel do Catálogo Shoppub",
      html: `<p>Olá!</p>
<p>Use o link abaixo para entrar no painel do catálogo (expira em 15 minutos):</p>
<p><a href="${url}">Entrar no painel</a></p>
<p>Se você não pediu este acesso, ignore este e-mail.</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend falhou (${res.status}): ${body.slice(0, 300)}`);
  }
}
