INSERT INTO user_locations (userid, location)
VALUES ($1::text, $2::text)
ON CONFLICT (userid) DO UPDATE
	SET location = excluded.location;
