# sinon-mongo

Extend [sinon.js](https://sinonjs.org/) with stubs for testing code that uses the MongoDB [Node.js driver](https://mongodb.github.io/node-mongodb-native/4.0/index.html)

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)
* [Examples](#examples)
* [Licence](#license)

## Installation

```sh
$ npm install sinon-mongo
```

> sinon-mongo expects sinon >=6.3.0 and mongodb >=4.X as **peer-dependencies**.

> If you use mongodb 3.X, please install version 1.1.0 of sinon-mongo

## Usage

Simply `require('sinon-mongo')` to extend sinon with a `sinon.mongo` object.
```js
const sinon = require('sinon');
require('sinon-mongo');
// sinon.mongo is now available!
```

Then use `sinon.mongo` to create stubs of various classes in the mongo API.
```js
// ---- stub collections ----
const mockCollection = sinon.mongo.collection({
  // optionally specific stubs defined when creating the stub collection
  findOneAndUpdate: sinon.stub().withArgs({name: 'foo'}).resolves({value: {a: 'mock object'}});
});
// By default, every collection method is also a sinon stub
mockCollection.findOne.withArgs({name: 'foo'}).resolves({a: 'mock object'});


// ---- stub databases ----
const mockDb = sinon.mongo.db({
  // optionally provide a specific map of collection names and stubs
  customers: sinon.mongo.collection()
});
// By default, every Db method is also a sinon stub, including the collection() method
mockDb.collection.withArgs('organizations').returns({the: 'mock organizations collection'});


// ---- stub MongoClients ---
const mockMongoClient = sinon.mongo.mongoClient({
  // optionally provide a specific map of database names and stubs
  reporting: sinon.mongo.db()
});
// By default, every MongoClient method is also a sinon stub, including the db() method
mockMongoClient.db.withArgs('myDbName').returns({the: 'mock database'});
// The connect method stub is already setup so it resolves with the mongoClient and can be chained
mockMongoClient.connect().then(mongoClient => mongoClient.db('myDbName'));

```

## API

### sinon.mongo.collection

Use this API to create stubs of the MongoDB [Collection](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html) type.

Every method available in the MongoDB **Collection** type is defaulted as a sinon stub, whose behaviour you can further customise.
```js
sinon.mongo.collection(methodStubs[optional])

// Basic usage:
const mockCollection = sinon.mongo.collection();
mockCollection.findOne.withArgs(...).resolves(...);

// Optionally provide method stubs.
// Equivalent to the earlier example:
const mockCollection2 = sinon.mongo.collection({
  findOne: sinon.stub().withArgs(...).resolves(...);
});
// Methods that were not provided are still available as stubs
mockCollection2.findOneAndUpdate.withArgs(...).resolves(...);
sinon.assert.calledOnce(mockColletion2.insertOne);
```

### sinon.mongo.db

Use this API to create stubs of the MongoDB [Db](https://mongodb.github.io/node-mongodb-native/4.0/classes/db.html) type.

Every method available in the MongoDB **Db** type is defaulted as a sinon stub, whose behaviour you can further customise.
```js
sinon.mongo.db(collectionMap[optional], methodStubs[optional])

// Basic usage:
const mockDb = sinon.mongo.db();
mockDb.collection.withArgs(...).resolves(...);
mockDb.dropCollection.withArgs(...).resolves(...);

// Optionally provide a collections map to avoid manually setting the behaviour of the collection() method
const mockDb2 = sinon.mongo.db({
  customers: mockCustomersCollection,
  organizations: mockOrganizationsCollection
});

// Optionally provide method stubs
const mockDb3 = sinon.mongo.db({}, {
  dropCollection: sinon.stub().withArgs(...).resolves(...);
});
// Method stubs that were not specifically provided are still defaulted as stubs
mockDb3.listCollections.resolves(...);
```

### sinon.mongo.mongoClient

Use this API to create stubs of the MongoDB [MongoClient](https://mongodb.github.io/node-mongodb-native/4.0/classes/mongoclient.html) type.

Every method available in the MongoDB **MongoClient** type is defaulted as a sinon stub, whose behaviour you can further customise.
```js
sinon.mongo.mongoClient(databaseMap[optional], methodStubs[optional])

// Basic usage:
const mockMongoClient = sinon.mongo.mongoClient();
mockMongoClient.db.withArgs(...).resolves(...);

// Optionally provide a database map to avoid manually setting the behaviour of the db() method
const mockMongoClient2 = sinon.mongo.db({
  default: mockDefaultDatabase,
  reporting: mockReportingDatabase
});

// Optionally provide method stubs
const mockMongoClient3 = sinon.mongo.db({}, {
  isConnected: sinon.stub().withArgs(...).returns(...);
});
// Method stubs that were not specifically provided are still defaulted as stubs
mockMongoClient3.close.resolves();
```

### sinon.mongo.documentArray

When testing code that uses some of the collection operations that return multiple documents, like [find](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#find), you can use this helper API to quickly stub its `toArray()` result, resolving to a promise with the required array.
```js
sinon.mongo.documentArray(documents[optional, Array|Object])

// code you want to test:
return collection.find({name: 'foo'}).toArray();

// in test code:
const mockCollection = sinon.mongo.collection();
mockCollection.find
  .withArgs({name: 'foo'})
  .returns(sinon.mongo.documentArray([{the: 'first document'}, {the: 'second document'}]))

// You can return an empty array or an array of a single document:
sinon.mongo.documentArray()
sinon.mongo.documentArray({the: 'single document'})
```

### sinon.mongo.documentStream

When testing code that uses some of the collection operations that return multiple documents, like [find](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#find), you can use this helper API to quickly stub its `stream()` result, returning a **readable stream** that emits the provided documents.
```js
sinon.mongo.documentStream(documents[optional, Array|Object])

// code you want to test (both are equivalent):
return collection.find({name: 'foo'});
return collection.find({name: 'foo'}).stream();

// in test code:
const mockCollection = sinon.mongo.collection();
mockCollection.find
  .withArgs({name: 'foo'})
  .returns(sinon.mongo.documentStream([{the: 'first document'}, {the: 'second document'}]))

// You can return an empty stream or an stream that emits a single document:
sinon.mongo.documentStream()
sinon.mongo.documentStream({the: 'single document'})
```

## Examples

The following sections include full examples of what might be typical code using mongo and its unit tests using sinon-mongo.

### Express controller

Let's say you have an [express](https://expressjs.com/) controller that talks directly to the database through an injected `req.db`:
```js
const mongodb = require('mongodb');

module.exports = {
  get(req, res, next){
    return req
      .db
      .collection('customers')
      .findOne({_id: mongodb.ObjectId(req.params.id)})
      .then(cust => res.send(cust))
      .catch(next);
  },
  post(req, res, next){
    return req
      .db
      .collection('customers')
      .updateOne({_id: mongodb.ObjectId(req.params.id)}, {$set: req.body})
      .then(() => res.sendStatus(204))
      .catch(next);
  }
};
```

Then a test using sinon-mongo could look like:
```js
const mongodb = require('mongodb');
const sinon = require('sinon');
require('sinon-mongo');
const sampleController = require('../src/sample-controller');

describe('the sample controller', () => {
  let mockRequest;
  let mockResponse;
  let mockId;
  let mockCustomerCollection;
  beforeEach(() => {
    mockId = mongodb.ObjectId();
    mockRequest = {
      params: { id: mockId.toString() },
      body: { the: 'mock body' },
    };
    mockResponse = {
      send: sinon.spy(),
      sendStatus: sinon.spy()
    };

    // inject mock db and collection into the request object
    mockCustomerCollection = sinon.mongo.collection();
    mockRequest.db = sinon.mongo.db({
      customers: mockCustomerCollection
    });
  });

  it('returns a customer by id', () => {
    const mockCustomer = {a: 'mock customer'};
    mockCustomerCollection.findOne
      .withArgs({ _id: mockId })
      .resolves(mockCustomer);

    return sampleController.get(mockRequest, mockResponse).then(() => {
      sinon.assert.calledWith(mockResponse.send, mockCustomer);
    });
  });

  it('updates a customer by id', () => {
    mockCustomerCollection.updateOne
      .withArgs({ _id: mockId }, { $set: mockRequest.body })
      .resolves();

    return sampleController.post(mockRequest, mockResponse).then(() => {
      sinon.assert.calledOnce(mockCustomerCollection.updateOne);
      sinon.assert.calledWith(mockResponse.sendStatus, 204);
    });
  });
});
```

### Classic Repository

In this example, let's assume we have a classic repository module as:
```js
const mongodb = require('mongodb');

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
```

Notice how the db is manually injected, so in order to use this repository module you would `const repo = require('./sample-repository')(dbInstance)`.
This makes easy to inject a mock db when writing a test:
```js
const expect = require('chai').expect;
const mongodb = require('mongodb');
const sinon = require('sinon');
require('sinon-mongo');
const sampleRepository = require('../src/sample-repository');

describe('the sample repository', () => {
  let mockId;
  let mockDb;
  let mockCustomerCollection;
  let repository;
  beforeEach(() => {
    mockId = mongodb.ObjectId();

    // inject mock db into the repository
    mockCustomerCollection = sinon.mongo.collection();
    mockDb = sinon.mongo.db({
      customers: mockCustomerCollection
    });
    repository = sampleRepository(mockDb);
  });

  it('returns all the customers for the given org name', () => {
    const mockCustomers = [{a: 'mock customer'}, {another: 'mock customer'}];
    mockCustomerCollection.find
      .withArgs({ orgName: 'mockOrgName' })
      .returns(sinon.mongo.documentArray(mockCustomers));

    return repository.findCustomersInOrganization('mockOrgName').then(customers => {
      expect(customers).to.be.eql(mockCustomers);
    });
  });

  it('updates a customer by its id', () => {
    const mockUpdates = {the: 'updated properties'};
    const mockUpdatedCustomer = {the: 'updated customer'};
    mockCustomerCollection.findOneAndUpdate
      .withArgs({ _id: sinon.match(val => mockId.equals(val) }, { $set: mockUpdates })
      .resolves({ value: mockUpdatedCustomer });

    return repository.updateCustomer(mockId, mockUpdates).then(updatedCustomer => {
      expect(updatedCustomer).to.be.eql(mockUpdatedCustomer);
    });
  });
});
```

A typical variant would be using a helper in the repository to retrieve the database, rather than manually injecting it. In that case you would use something like [proxyquire](https://github.com/thlorenz/proxyquire) to write your test and inject the mock db:
```js
// in sample-repository.js
const getDb = require('./some/getdb-utility');
...
module.exports = db => ({
  findCustomersInOrganization(orgName){
    return db
      .collection('customers')
      .find({ orgName })
      .toArray();
  },
  ...
});

// In the unit test
beforeEach(() => {
  ...
  // inject mock db into the repository
  ...
  repository = proxyquire('../src/sample-repository', {
    './some/getdb-utility': () => mockDb
  });
});

```

## License

MIT © [Daniel Jimenez Garcia](https://danijg.github.io/)