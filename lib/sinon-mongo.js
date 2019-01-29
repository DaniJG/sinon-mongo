const Stream = require('stream');
const { MongoClient, Db } = require('mongodb');
const Collection = require('mongodb/lib/collection');

const install = sinon => {

  sinon.mongo = sinon.mongo || {};

  // Helpers to create stubs of MongoClient, Db and Collection
  sinon.mongo.mongoClient = (databases, methodStubs) => {
    const dbGetterStub = sinon.stub();
    dbGetterStub.returns(sinon.mongo.db());
    if (databases){
      Object.getOwnPropertyNames(databases)
        .forEach(dbName => dbGetterStub.withArgs(dbName).returns(databases[dbName]))
    }

    const stubMongoClient = sinon.createStubInstance(
      MongoClient, 
      Object.assign({
        db: dbGetterStub
      }, methodStubs)
    );
    stubMongoClient.connect = sinon.stub().resolves(stubMongoClient);
    return stubMongoClient;
  };

  sinon.mongo.db = (collections, methodStubs) => {
    const collectionGetterStub = sinon.stub();
    collectionGetterStub.returns(sinon.mongo.collection());
    if (collections){
      Object.getOwnPropertyNames(collections)
        .forEach(collName => collectionGetterStub.withArgs(collName).returns(collections[collName]))
    }
    return sinon.createStubInstance(
      Db, 
      Object.assign({
        collection: collectionGetterStub
      }, methodStubs)
    );
  };

  sinon.mongo.collection = methodStubs => sinon.createStubInstance(
    Collection, 
    methodStubs
  );

  // Helpers to create array/stream results for collection operations
  sinon.mongo.documentArray = result => {
    if (!result) result = [];
    if (result.constructor !== Array) result = [result];  

    return {
      toArray: () => Promise.resolve(result)
    };
  };

  sinon.mongo.documentStream = result => {
    if (!result) result = [];
    if (result.constructor !== Array) result = [result];  
    
    const readableStream = new Stream.Readable({objectMode: true});
    result.forEach(item => readableStream.push(item));
    readableStream.push(null);

    // mimick mongo API for collection methods. By default methods return a stream but it also has an explicit stream() method
    readableStream.stream = () => readableStream;
    return readableStream;
  };
};


module.exports = {
  install,
};