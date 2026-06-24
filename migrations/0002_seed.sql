-- Seed inicial para o primeiro deploy não vir vazio. Depois as lojas são
-- gerenciadas pelo painel (/admin). Ajuste o owner_email conforme necessário.
INSERT OR IGNORE INTO lojas (slug, name, feed_url, whatsapp, primary_color, show_price, owner_email)
VALUES
  ('cavalaria', 'Cavalaria', 'https://www.cavalariashop.com.br/feed/todos-os-produtos1/', '5511999999999', '#4a3b2a', 0, 'tar@shoppub.com.br');
