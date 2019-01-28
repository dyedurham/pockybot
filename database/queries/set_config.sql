INSERT INTO generalconfig (name, value)
VALUES ($1::text, $2::int)
ON CONFLICT (name) DO UPDATE
	SET value = excluded.value;
