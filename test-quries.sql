SELECT properties.*, avg(property_reviews.rating) as average_rating, count(property_reviews.rating) as review_count
  FROM properties
  LEFT JOIN property_reviews ON properties.id = property_id
  WHERE properties.owner_id = 1006 GROUP BY properties.id ORDER BY cost_per_night LIMIT 5;


SELECT city FROM properties WHERE owner_id = 1006;




    INSERT INTO properties (
    title, description, owner_id, cover_photo_url, thumbnail_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, active, province, city, country, street, post_code) 
    VALUES (
    'List least', 'description', 1, 'https://images.pexels.com/photos/2099019/pexels-photo-2099019.jpeg', 'https://images.pexels.com/photos/2099019/pexels-photo-2099019.jpeg?auto=compress&cs=tinysrgb&h=350', 34565, 0, 1, 1, true, 'Newfoundland And Labrador', 'Paradise', 'Canada', '1848 Cuzo Trail', '08409');

      INSERT INTO properties (
    title, description, owner_id, cover_photo_url, thumbnail_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, active, province, city, country, street, post_code) 
    VALUES (
    'List least', 'description', 2, 'https://images.pexels.com/photos/2099019/pexels-photo-2099019.jpeg', 'https://images.pexels.com/photos/2099019/pexels-photo-2099019.jpeg?auto=compress&cs=tinysrgb&h=350', 34565, 0, 1, 1, true, 'Newfoundland And Labrador', 'Paradise', 'Canada', '1848 Cuzo Trail', '08409');


    SELECT properties.*, avg(property_reviews.rating) as average_rating, count(property_reviews.rating) as review_count
  FROM properties
  LEFT JOIN property_reviews ON properties.id = property_id
  AND properties.owner_id = $1 GROUP BY properties.id ORDER BY cost_per_night LIMIT $2
