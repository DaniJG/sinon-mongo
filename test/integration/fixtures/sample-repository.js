const mongodb = require('mongodb');

// In this example, db is explicitly injected when retrieving the repo
// So usage of this file would look like:
//    const myRepo = require('./sample-repository')(db);
// And it is up to the caller to provide.
// This makes injecting the db mock a trivial exercise when testing this file.
// However, code can be typically organized so the repo uses a common helper to retrieve a global connection:
//    const getDb = require('my/module');
//    ...
//    find(orgName){
//      return getDb().collection('customers')...
// In which case you would use something like proxyquire in order to inject the db mock
module.exports = db => ({
  findCustomersInOrganization(orgName){
    return db
      .collection('customers')
      .find({ orgName })
      .toArray();
  },
  updateCustomer(id, updates){
    return db
      .collection('customers')
      .findOneAndUpdate({_id: mongodb.ObjectId(id)}, {$set: updates})
      .then(res => res.value);
  }
});