WITH count AS (
	SELECT sender, COUNT(*) AS pegsSent, dense_rank() OVER (ORDER BY COUNT(*) DESC) AS rank
	FROM pegs l
	GROUP BY sender
)
SELECT senders.username sender, pegsSent, receivers.username receiver, pegs.comment
FROM count
INNER JOIN pegs ON count.sender = pegs.sender
INNER JOIN pockyusers AS senders ON count.sender = senders.userid
INNER JOIN pockyusers AS receivers ON pegs.receiver = receivers.userid
ORDER BY count.pegsSent DESC, pegs.sender;
