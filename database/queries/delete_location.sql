DELETE FROM locations
WHERE name = $1::text;
