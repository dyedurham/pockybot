SELECT p.receiver, p.comment
FROM pegs p
WHERE sender = $1::text;