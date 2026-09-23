-- Primero crear las cuentas en Authentication > Users > Add user > Create new user.
-- Usar correos reales y contraseñas propias de acceso a Bruma, NO la contraseña de la base.
-- Reemplazar los DOS correos de abajo por las cuentas que quieras autorizar.
-- Para habilitar solo una cuenta, dejar un único correo dentro del array.
-- No modifica permisos de otros usuarios ni envía correos.
do $$
declare
 correos text[] := array['TU_CORREO@EJEMPLO.COM','CORREO_HERMANO@EJEMPLO.COM'];
 correo text;
 usuario uuid;
begin
 foreach correo in array correos loop
  select id into usuario from auth.users where lower(email)=lower(trim(correo));
  if usuario is null then
   raise exception 'No existe la cuenta %. Creala primero en Authentication > Users.',correo;
  end if;
  insert into public.bruma_members(user_id) values(usuario) on conflict(user_id) do nothing;
 end loop;
end;
$$;
