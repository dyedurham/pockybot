WITH count AS (
	-- use rank() instead to return only the top three users (plus tied overflows)
	SELECT receiver, COUNT(*) AS pegsReceived, dense_rank() OVER (ORDER BY COUNT(*) DESC) AS rank
	FROM pegs l
	GROUP BY receiver
)
SELECT receivers.username receiver, pegs.receiver receiverid, senders.username sender, pegs.comment
FROM count
INNER JOIN pegs ON count.receiver = pegs.receiver
INNER JOIN pockyusers AS receivers ON count.receiver = receivers.userid
INNER JOIN pockyusers AS senders ON pegs.sender = senders.userid
ORDER BY count.pegsReceived DESC, pegs.receiver;
