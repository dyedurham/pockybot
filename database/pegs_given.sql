SELECT COUNT(*)
FROM pegs
WHERE sender = $1::text;