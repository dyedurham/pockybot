SELECT EXISTS(SELECT 1 FROM pockyusers WHERE userid = $1::text);
