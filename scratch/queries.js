'use strict';

const knex = require('../knex');

let searchTerm = 'gaga';
knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(err => {
    console.error(err);
  });

let searchId = 1001;

knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .where('notes.id', searchId)
  .then(results => {
    console.log(JSON.stringify(results[0]));
  })
  .catch(err => {
    console.error(err);
  });

let updateTitle = 'UpdateTitle';
let updateContent = 'Update content';

knex('notes')
  .where('notes.id', searchId)
  .update({
    title: updateTitle,
    content: updateContent
  })
  .returning(['id', 'title', 'content'])
  .then(result => {
    console.log(JSON.stringify(result[0]));
  })
  .catch(err => {
    console.error(err);
  });


let createdTitle = 'New Title';
let createdContent = 'New Content';

knex('notes')
  .insert({title: createdTitle, content: createdContent})
  .returning(['id', 'title', 'content'])
  .then(result => {
    console.log(JSON.stringify(result[0]));
  })
  .catch(err => {
    console.error(err);
  });

let deleteId = 1010;

knex('notes')
  .where('id', deleteId)
  .del()
  .then(() => {
    console.log(`Note with Id: ${deleteId} was deleted`);
  })
  .catch(err => {
    console.error(err);
  });