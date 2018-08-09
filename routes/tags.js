'use strict';

const express = require('express');
const knex = require('../knex');

// Create an router instance (aka "mini-app")
const router = express.Router();


// GET all tags
router.get('/tags', (req, res, next) =>{
  knex.select('id', 'name')
    .from('tags')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

// GET tag by id
router.get('/tags/:id', (req, res, next) => {
  const { id } = req.params;
  knex.select('id', 'name')
    .from('tags')
    .where('tags.id', id)
    .then(results => {
      if (results) {
        res.json(results[0]);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

// PUT request to update a tag
router.put('/tags/:id', (req, res, next) => {
  const { id } = req.params;
  const updateObj = {};
  const updateFields = ['name'];

  if (updateFields[0] in req.body) {
    updateObj[updateFields[0]] = req.body[updateFields[0]];
  }

  if(!updateObj['name']) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('tags')
    .where('tags.id', id)
    .update(updateObj)
    .returning(['id', 'name'])
    .then(result => {
      res.json(result[0]);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE ITEM ========== */
router.post('/tags', (req, res, next) => {
  const { name } = req.body;
  
  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  
  const newItem = { name };
  
  knex.insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then((results) => {
      // Uses Array index solution to get first item in results array
      const result = results[0];
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

// DELETE a tag
router.delete('/tags/:id', (req, res, next) => {
  const { id } = req.params;
  knex('tags')
    .where('tags.id', id)
    .del()
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});


module.exports = router;