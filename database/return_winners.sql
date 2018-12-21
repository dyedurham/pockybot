WITH goodPegs AS (
	WITH goodSenders AS (
		SELECT sender, COUNT(*)
		FROM pegs
		GROUP BY sender
		-- minimum number of pegs someone must have sent out to be eligible to win
		HAVING COUNT(*) >= $1::int
	)
	SELECT p.receiver, p.sender, p.comment
	FROM pegs p
	WHERE p.receiver IN (SELECT cp.sender FROM goodSenders cp)
), count AS (
	-- use rank() instead to return only the top three users (plus tied overflows)
	SELECT receiver, COUNT(*) AS pegsReceived, dense_rank() OVER (ORDER BY COUNT(*) DESC) AS rank
	FROM goodPegs
	GROUP BY receiver
)
SELECT r.username receiver, c.receiver receiverid, c.pegsReceived, s.username sender, p.comment
FROM count c
INNER JOIN goodPegs p ON c.receiver = p.receiver
INNER JOIN pockyusers r ON c.receiver = r.userid
INNER JOIN pockyusers s ON p.sender = s.userid
-- number of places of winners to return
WHERE rank <= $2::int
ORDER BY c.pegsReceived DESC, p.receiver;
