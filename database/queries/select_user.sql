SELECT username, userid
FROM pockyusers
WHERE userid = $1::text;
