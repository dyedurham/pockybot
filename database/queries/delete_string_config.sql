delete from stringconfig
WHERE name = $1::text AND value = $2::text;
