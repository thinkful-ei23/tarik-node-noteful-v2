'use strict';

function hydrateNotes(input) {
  const hydrated = [], lookup = {};
  for (let note of input) {
    if (!lookup[note.id]) {
      lookup[note.id] = note;
      lookup[note.id].tags = [];
      hydrated.push(lookup[note.id]);
    }
  
    if (note.tagId && note.tagName) {
      lookup[note.id].tags.push({
        id: note.tagId,
        name: note.tagName
      });
    }
    delete lookup[note.id].tagId;
    delete lookup[note.id].tagName;
  }
  return hydrated;
}

module.exports = hydrateNotes;