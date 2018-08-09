'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
//const data = require('../db/notes');
//const simDB = require('../db/simDB');
const knex = require('../knex');

const hydrateNotes = require('../utils/hydrateNotes');

//const notes = simDB.initialize(data);

// Get All (and search by query)
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;

  knex
    .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.name as tagName', 'tags.id as tagId')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes_tags.note_id', 'notes.id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .modify(queryBuilder => {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(queryBuilder => {
      if (folderId) {
        queryBuilder.where('folders.id', folderId);
      }
    })
    .modify(queryBuilder => {
      if (tagId) {
        queryBuilder.where('tag_id', tagId);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      if (results) {
        const hydrated = hydrateNotes(results);
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });

});

// Get a single item
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.name as tagName', 'tags.id as tagId')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes_tags.note_id', 'notes.id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .where('notes.id', id)
    .then(results => {
      if (results.length) {
        const hydrated = hydrateNotes(results)[0];
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

// Put update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const tags = req.body.tags;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content', 'folder_id'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });


  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  let noteId;

  knex('notes')
    .where('notes.id', id)
    .update(updateObj)
    .returning('id')
    .then(([id]) => {
      noteId = id;
      return knex('notes_tags')
        .where('note_id', noteId)
        .del()
        .then(() => {
          const tagsInsert = tags.map(tagId => ({note_id: noteId, tag_id: tagId}));
          return knex.insert(tagsInsert).into('notes_tags');
        });
    })
    .then(() => {
      return knex.select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes_tags.note_id', 'notes.id')
        .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if(result) {
        const hydrated = hydrateNotes(result)[0];
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;

  const newItem = {
    title: title,
    content: content,
    folder_id: folderId
  };
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  
  let noteId;

  knex('notes')
    .insert(newItem)
    .returning('id')
    .then(([id]) => {
      noteId = id;
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId}));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      return knex.select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes_tags.note_id', 'notes.id')
        .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result)[0];
        res.location(`${req.originalUrl}/${result.id}`).status(201).json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

// Delete an item
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  
  knex('notes')
    .where('id', id)
    .del()
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
