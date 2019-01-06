SELECT userid, username
FROM pockyusers
WHERE userid = $1::text;
