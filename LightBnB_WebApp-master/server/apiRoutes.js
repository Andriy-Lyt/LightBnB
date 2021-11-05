module.exports = function(router, database) {
  //my file
  
    router.get('/properties', (req, res) => {
      // console.log("req.query:", req.query);
      database.getAllProperties(req.query, 20)
      //server sends data back to the browser;
      //browser generates html including thus data,
      // properties var is the data sent back to the client
      .then(properties => res.send({properties}))
      .catch(e => {
        console.error(e);
        res.send(e)
      }); 
    });
  
    router.get('/reservations', (req, res) => {
      const userId = req.session.userId;
      if (!userId) {
        res.error("💩");
        return;
      }
      database.getFulfilledReservations(userId)
      .then(reservations => res.send({reservations}))
      .catch(e => {
        console.error(e);
        res.send(e)
      });
    });
  
    router.post('/properties', (req, res) => {
      const userId = req.session.userId;
      database.addProperty({...req.body, owner_id: userId})
        .then(property => {
          res.send(property);
        })
        .catch(e => {
          console.error(e);
          res.send(e)
        });
    });
  
    router.post('/reservations', (req, res) => {
      const userId = req.session.userId;
      if (userId) {
        console.log("req.body = ", req.body);
        
        database.addReservation({...req.body, guest_id: userId})
        .then(reservation => {
          console.log("reservation apiRouites line 45: ", reservation);
          res.send(reservation)
        })
        .catch(e => {
          console.error(e);
          res.send(e);
        })
      } 
    }) 
  
    router.get('/reservations/upcoming', (req, res) => {
      const userId = req.session.userId;
      if (!userId) {
        res.error("💩");
        return;      
      }
      database.getUpcomingReservations(userId)
      .then(reservations => { 
        console.log("reservation apiRouites line 63: ", reservations);
        res.send({ reservations });
        })
      .catch(e => {
        console.error(e);
        res.send(e);
      });
    });
  
    router.get('/reservations/:reservation_id', (req, res) => {
      const reservationId = req.params.reservation_id;
      database.getIndividualReservation(reservationId)
      .then(reservation => res.send(reservation))
      .catch(e => {
        console.error(e);
        res.send(e);
      });
    });

      // update an existing reservation
      router.post('/reservations/:reservationId', (req, res) => {
      const reservationId = req.params.reservationId;
      database.updateReservation({...req.body, reservation_id: reservationId})
      .then(reservation => res.send(reservation))
      .catch(e => {
        console.error(e);
        res.send(e)
      });
    });
  
    router.get('/reviews/:property_id', (req, res) => {
      const propertyId = req.params.property_id;
      database.getReviewsByProperty(propertyId)
        .then(reviews => res.send(reviews))
        .catch(e => {
          console.error(e);
          res.send(e)
        });
    });
    
     // delete a reservation
     router.delete('/reservations/:reservationId', (req, res) => {
      const reservationId = req.params.reservationId;
      database.deleteReservation(reservationId)
      .then(() => {
        // console.log("delete reserv redirect");
        res.redirect(303, '/api/reservations');
      });
    })
  
    // get reviews by property
    router.get('/reviews/:propertyId', (req, res) => {
      const propertyId = req.params.propertyId
      database.getReviewsByProperty(propertyId)
      .then(reviews => {
        res.send(reviews);
      })
    })
  
  router.post('/reviews/:reservation_id', (req, res) => {
    database.addReview(req.body)
      .then(review => {
        res.send(review);
      })
      .catch(e => {
        console.error(e);
        res.send(e)
      });
  });
  
    
    return router;
  }