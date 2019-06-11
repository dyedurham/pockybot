SELECT (comment)
FROM pegs
WHERE sender = $1::text;
