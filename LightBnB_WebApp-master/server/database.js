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

/* original function:
const getUserWithEmail = function(email) {
  let user;
  for (const userId in users) {
    user = users[userId];
    if (user.email.toLowerCase() === email.toLowerCase()) {
      break;
    } else {
      user = null;
    }
  }
  return Promise.resolve(user);
}
 */
const getUserWithEmail = function(email) {

  return new Promise(function(resolve, reject) {
    const queryString = `SELECT * FROM users WHERE email = $1`;
    const values = [email];
  
    pool.query(queryString, values)
    .then(res => {
      // console.log(res.rows);
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
/* original function
const getUserWithId = function(id) {
  return Promise.resolve(users[id]);
}
 */
const getUserWithId = function(id) {
  // console.log("get user with id line 63");

  return new Promise(function(resolve, reject) {
    const queryString = `SELECT * FROM users WHERE id = $1`;
    const values = [id];
  
    pool.query(queryString, values)
    .then(res => {
      // console.log(res.rows);
      return res.rows[0];
    })
    .catch(err => {
      // console.log("line 74 db file");
      return null});
  
  })
}

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
/* original function
const addUser =  function(user) {
  const userId = Object.keys(users).length + 1;
  user.id = userId;
  users[userId] = user;
  return Promise.resolve(user);
}
 */
 const addUser =  function(user) {

  return new Promise(function(resolve, reject) {
    const queryString = `INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING *`;
    const values = [user.name, user.email, user.password];
  
    pool.query(queryString, values)
    .then(res => {
      // console.log(res.rows);
      resolve(res.rows[0]);
    })
    .catch(err => { 
      // console.log("Error from .catch");
      reject(err)} );
  })
}

 exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

/* original function 
const getFulfilledReservations = function(guest_id, limit = 10) {
  return getAllProperties(null, 2);
}
 */
const getFulfilledReservations = function(guest_id, limit = 10) {
  const queryString = `
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;`;
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


/* Original function
const getAllProperties = function(options, limit = 10) {
  const limitedProperties = {};
  for (let i = 1; i <= limit; i++) {
    limitedProperties[i] = properties[i];
  }
  return Promise.resolve(limitedProperties);
}
 */

const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating, count(property_reviews.rating) as review_count
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3 city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  //3.1 owner_id
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `AND properties.owner_id = $${queryParams.length} `;
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

  // 5
  console.log("queryString", queryString);

  // 6
  return pool.query(queryString, queryParams)
  .then(
    (res) => {
      //  console.log("line 221", res.rows[0].id);
      return res.rows;
    });
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

/* original function 
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
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
      // console.log(res.rows);
      resolve(res.rows[0]);
    })
    .catch(err => { 
      // console.log("Error from .catch");
      reject(err)} );
  })
};

exports.addProperty = addProperty;

const addReservation = function(reservation) {
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
//
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
    .then(res => res.rows);
}

exports.getUpcomingReservations = getUpcomingReservations;
//
//  Updates an existing reservation with new information
//
const updateReservation = function(reservationData) {
  // base string
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
  console.log(queryString);
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

//Get indiv reservation
const getIndividualReservation = function(reservationId) {
  const queryString = `SELECT * FROM reservations WHERE reservations.id = $1`;
  return pool.query(queryString, [reservationId])
    .then(res => res.rows[0]);
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