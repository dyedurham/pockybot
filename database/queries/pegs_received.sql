SELECT (comment)
FROM pegs
WHERE receiver = $1::text;
