const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = function(email) {

  return new Promise(function(resolve, reject) {
    const queryString = `SELECT * FROM users WHERE email = $1`;
    const values = [email];
  
    pool.query(queryString, values)
    .then(res => {
      resolve(res.rows[0]) ;
    })
    .catch(err => null);
  });
}

 exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

 const getUserWithId = function(id) {

    return new Promise(function(resolve, reject) {
    const queryString = `SELECT * FROM users WHERE id = $1`;
    const values = [id];
  
    pool.query(queryString, values)
    .then(res => {
      resolve(res.rows[0])  ;
    })
    .catch(err => {
      resolve(null) ;
    }); 
  });
}

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

 const addUser =  function(user) {

  return new Promise(function(resolve, reject) {
    const queryString = `INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING *`;
    const values = [user.name, user.email, user.password];
  
    pool.query(queryString, values)
    .then(res => {
      resolve(res.rows[0]);
    })
    .catch(err => { 
      reject(err)} );
  })
}

 exports.addUser = addUser;

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

const getFulfilledReservations = function(guest_id, limit = 10) {
  const queryString = `
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  LEFT JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;`;
  // console.log(queryString);
  // AND reservations.end_date < now()::date
  const params = [guest_id, limit];
  return pool.query(queryString, params)
    .then(res => res.rows);
}
exports.getFulfilledReservations = getFulfilledReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function (options, limit = 10) {
  // console.log("options", options);
  
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating, count(property_reviews.rating) as review_count
  FROM properties
  LEFT JOIN property_reviews ON properties.id = property_id
  `;

  // 3 city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  //3.1 owner_id
  if (options.owner_id) {
    if (queryParams.length === 0) {
      queryParams.push(`${options.owner_id}`);
      queryString += `WHERE properties.owner_id = $${queryParams.length} `;
    }
    else {
      queryParams.push(`${options.owner_id}`);
      queryString += `AND properties.owner_id = $${queryParams.length} `;
    }
  }

  //3.2 min-max price
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(`${Math.floor(options.minimum_price_per_night) * 100} `);
    queryParams.push(`${Math.floor(options.maximum_price_per_night) * 100} `);
    queryString += `AND properties.cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length } `;
  }

  // 4 Group By
  queryString += `GROUP BY properties.id `;

  //4.1 Having avg rating
  if (options.minimum_rating) {
    queryParams.push(`${ options.minimum_rating } `);
    queryString += `HAVING avg(rating) >= $${queryParams.length} `;
  }

// ORDER BY
  queryString += `ORDER BY cost_per_night `;

  //LIMIT
  queryParams.push(limit); 
  queryString += `LIMIT $${queryParams.length}`;
  // console.log("queryString", queryString);
  

  return pool.query(queryString, queryParams)
  .then(
    (res) => {
      // console.log("res.rows", res.rows);
      
      return res.rows;
    })
    .catch((err) => {console.log(err.message)
    });
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

const addProperty = function (property) {

  return new Promise(function(resolve, reject) {

    const queryString = `INSERT INTO properties(owner_id, title, description, thumbnail_photo_url, cover_photo_url,
      cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`;

    const values = [property.owner_id, property.title , property.description , property.thumbnail_photo_url , property.cover_photo_url , property.cost_per_night , 
      property.street , property.city , property.province , property.post_code , property.country , property.parking_spaces , property.number_of_bathrooms , property.number_of_bedrooms];
  
    pool.query(queryString, values)
    .then(res => {
      // console.log("add property, database.js, line 193 = ", res);
      resolve(res.rows);
    })
    .catch(err => { 
      reject(err)} );
  })
};
exports.addProperty = addProperty;

//Add reservarion
const addReservation = function(reservation) {
  // console.log("reservation = ", reservation);

  /*
   * Adds a reservation from a specific user to the database
   */
  return pool.query(`
    INSERT INTO reservations (start_date, end_date, property_id, guest_id)
    VALUES ($1, $2, $3, $4) RETURNING *;
  `, [reservation.start_date, reservation.end_date, reservation.property_id, reservation.guest_id])
  .then(res => res.rows[0])
}

exports.addReservation = addReservation;

//  Gets upcoming reservations
const getUpcomingReservations = function(guest_id, limit = 10) {
  const queryString = `
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.start_date > now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;`;
  const params = [guest_id, limit];
  return pool.query(queryString, params)
    .then(res => res.rows)
    .catch((e) => {
      console.log(e.message);
    });
}

exports.getUpcomingReservations = getUpcomingReservations;
//
//  Updates an existing reservation with new information
//
const updateReservation = function(reservationData) {
  
  let queryString = `UPDATE reservations SET `;
  const queryParams = [];
  if (reservationData.start_date) {
    queryParams.push(reservationData.start_date);
    queryString += `start_date = $1`;
    if (reservationData.end_date) {
      queryParams.push(reservationData.end_date);
      queryString += `, end_date = $2`;
    }
  } else {
    queryParams.push(reservationData.end_date);
    queryString += `end_date = $1`;
  }
  queryString += ` WHERE id = $${queryParams.length + 1} RETURNING *;`
  queryParams.push(reservationData.reservation_id);
  return pool.query(queryString, queryParams)
    .then(res => res.rows[0])
    .catch(err => console.error(err));
}

exports.updateReservation = updateReservation;
//
//  Deletes an existing reservation
//
const deleteReservation = function(reservationId) {
  const queryParams = [reservationId];
  const queryString = `DELETE FROM reservations WHERE id = $1`;
  return pool.query(queryString, queryParams)
    .then(() => console.log("Successfully deleted!"))
    .catch(() => console.error(err));
}
exports.deleteReservation = deleteReservation;

//Get indiv reservation
const getIndividualReservation = function(reservationId) {
  const queryString = `SELECT * FROM reservations WHERE reservations.id = $1`;
  return pool.query(queryString, [reservationId])
    .then(res => res.rows[0])
    .catch((e) => {
      console.log(e.message);
    });
}

exports.getIndividualReservation = getIndividualReservation;

//get reviews by property
const getReviewsByProperty = function(propertyId) {
  const queryString = `
    SELECT property_reviews.id, property_reviews.rating AS review_rating, property_reviews.message AS review_text, 
    users.name, properties.title AS property_title, reservations.start_date, reservations.end_date
    FROM property_reviews
    JOIN reservations ON reservations.id = property_reviews.reservation_id  
    JOIN properties ON properties.id = property_reviews.property_id
    WHERE properties.id = $1
    ORDER BY reservations.start_date ASC;
  `
  const queryParams = [propertyId];
  return pool.query(queryString, queryParams).then(res => res.rows)
}

exports.getReviewsByProperty = getReviewsByProperty;

//add review
const addReview = function(review) {
  const queryString = `
    INSERT INTO property_reviews (guest_id, property_id, reservation_id, rating, message) 
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const queryParams = [review.guest_id, review.property_id, review.id, parseInt(review.rating), review.message];
  return pool.query(queryString, queryParams).then(res => res.rows);
}

exports.addReview = addReview;