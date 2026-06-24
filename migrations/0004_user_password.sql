-- Login por e-mail+senha: guarda o hash (PBKDF2, formato "salt:hash").
ALTER TABLE usuarios ADD COLUMN password_hash TEXT;
