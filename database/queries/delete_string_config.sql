delete from stringconfig
WHERE name = $1::text AND LOWER(value) = LOWER($2::text);
