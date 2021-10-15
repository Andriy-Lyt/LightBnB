SELECT * FROM users
WHERE email = 'tristanjacobs@gmail.com';

SELECT avg(end_date - start_date) as average_duration
FROM reservations;

SELECT properties.*, avg(property_reviews.rating) as average_rating
FROM properties
JOIN property_reviews ON properties.id = property_id
WHERE city LIKE '%ancouv%'
GROUP BY properties.id
HAVING avg(property_reviews.rating) >= 4
ORDER BY cost_per_night
LIMIT 10;

SELECT city, count(reservations) as total_reservations
FROM properties
JOIN reservations ON properties.id = reservations.property_id
GROUP BY city
ORDER BY total_reservations DESC;

SELECT reservations.*, properties.*, avg(rating) as average_rating
FROM properties
JOIN reservations ON properties.id = reservations.property_id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = 1
AND end_date < now()::date
GROUP BY reservations.id, properties.id
ORDER BY start_date 
LIMIT 10;