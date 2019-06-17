delete from stringconfig
WHERE name = $1::text AND LOWER(value) = $2::text;
