UPDATE pockyusers
SET username = $1::text
WHERE userid = $2::text;
