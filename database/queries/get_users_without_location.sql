SELECT * FROM pockyusers
WHERE userid NOT IN (
	SELECT userid FROM user_locations
);
