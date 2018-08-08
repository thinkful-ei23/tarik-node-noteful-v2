'use strict';

const express = require('express');
const knex = require('../knex');

// Create an router instance (aka "mini-app")
const router = express.Router();

router.get('/folders', (req, res, next) => {
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.get('/folders/:id', (req, res, next) => {
  const { id } = req.params;

  knex.select('id', 'name')
    .from('folders')
    .where('folders.id', id)
    .then(results => {
      if (results.length) {
        res.json(results[0]);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

router.put('/folders/:id', (req, res, next) => {
  const { id } = req.params;
  const updateObj = {};
  const updatableField = ['name'];

  if (updatableField[0] in req.body) {
    updateObj[updatableField[0]] = req.body[updatableField[0]];
  }

  if (!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .where('folders.id', id)
    .update(updateObj)
    .returning(['id', 'name'])
    .then(result => {
      res.json(result[0]);
    })
    .catch(err => {
      next(err);
    });
});

router.post('/folders', (req, res, next) => {
  const {name} = req.body;
  const newItem = {name};

  if (!newItem.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .insert(newItem)
    .returning(['id', 'name'])
    .then(result => {
      if (result) {
        res.status(201).json(result[0]);
      }
    })
    .catch(err => {
      next(err);
    });
});

router.delete('/folders/:id', (req, res, next) => {
  const id = req.params.id;

  knex('folders')
    .where('folders.id', id)
    .del()
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;