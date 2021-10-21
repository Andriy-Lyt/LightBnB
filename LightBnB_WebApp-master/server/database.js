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
const getAllReservations = function(guest_id, limit = 10) {
  return getAllProperties(null, 2);
}
 */
const getAllReservations = function(guest_id, limit = 5) {

  return new Promise(function(resolve, reject) {
    const queryString = `SELECT r.*, p.*, pr.* FROM  reservations r
    JOIN properties p ON r.property_id = p.id
    JOIN property_reviews pr ON r.id = pr.reservation_id
    WHERE r.guest_id = $1`;
    const values = [guest_id];
  
    pool.query(queryString, values)
    .then(res => {
      // console.log("line 140", res.rows[0]);
      resolve(res.rows) ;
    })
    .catch(err => { 
      console.log("Error from .catch line 144");
      reject(err)} );
  });
}

exports.getAllReservations = getAllReservations;

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

const getAllProperties = (options, limit = 10) => {
  return pool
    .query(`SELECT * FROM properties LIMIT $1`, [limit])
    .then((result) => {
      // console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
