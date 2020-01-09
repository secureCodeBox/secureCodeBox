const idMap = new Map();

function putId({ legacyId, newId }) {
  idMap[newId] = legacyId;
}

function getLegacyIdFor(id) {
  return idMap.get(id);
}

module.exports.putId = putId;
module.exports.getLegacyIdFor = getLegacyIdFor;
