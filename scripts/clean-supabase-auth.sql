-- Script SQL para limpiar usuarios de Supabase Auth
-- ⚠️ EJECUTAR EN SUPABASE DASHBOARD → SQL EDITOR
-- Solo para desarrollo/testing

-- Ver cuántos usuarios hay
SELECT 
  id, 
  email, 
  raw_app_meta_data->>'provider' as provider,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- DESCOMENTAR PARA ELIMINAR TODOS LOS USUARIOS
-- ⚠️ ESTO ES IRREVERSIBLE
-- DELETE FROM auth.users;

-- O eliminar solo usuarios específicos por email
-- DELETE FROM auth.users WHERE email = 'sebastian.castedoribera.03@gmail.com';

-- O eliminar solo usuarios de un provider específico
-- DELETE FROM auth.users WHERE raw_app_meta_data->>'provider' = 'google';
-- DELETE FROM auth.users WHERE raw_app_meta_data->>'provider' = 'github';
