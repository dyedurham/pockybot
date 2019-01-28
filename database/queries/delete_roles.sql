delete from roles
WHERE userid = $1::text
AND role = $2::role;
