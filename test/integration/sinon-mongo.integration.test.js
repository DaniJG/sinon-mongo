const sinon = require('sinon');
const expect = require('chai').expect;
const mongodb = require('mongodb');
const sampleController = require('./fixtures/sample-express-controller');
const sampleRepository = require('./fixtures/sample-repository');
require('../../index');

describe('sinon-mongo', () => {
  describe('used in the sample express controller', () => {
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

      // inject mock db into the request object
      mockCustomerCollection = sinon.mongo.collection();
      mockRequest.db = sinon.mongo.db({
        customers: mockCustomerCollection
      });
    });

    it('is used to test a get operation', () => {
      const mockCustomer = {a: 'mock customer'};
      mockCustomerCollection.findOne
        .withArgs({ _id: mockId })
        .resolves(mockCustomer);

      return sampleController.get(mockRequest, mockResponse).then(() => {
        sinon.assert.calledWith(mockResponse.send, mockCustomer);
      });
    });

    it('is used to test a post operation', () => {
      mockCustomerCollection.updateOne
        .withArgs({ _id: mockId }, { $set: mockRequest.body })
        .resolves();

      return sampleController.post(mockRequest, mockResponse).then(() => {
        sinon.assert.calledOnce(mockCustomerCollection.updateOne);
        sinon.assert.calledWith(mockResponse.sendStatus, 204);
      });
    });
  });

  describe('used in the sample repository', () => {
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

    it('is used to test a find operation', () => {
      const mockCustomers = [{a: 'mock customer'}, {another: 'mock customer'}];
      mockCustomerCollection.find
        .withArgs({ orgName: 'mockOrgName' })
        .returns(sinon.mongo.documentArray(mockCustomers));

      return repository.findCustomersInOrganization('mockOrgName').then(customers => {
        expect(customers).to.be.eql(mockCustomers);
      });
    });

    it('is used to test a findOneAndUpdate operation', () => {
      const mockUpdates = {the: 'updated properties'};
      const mockUpdatedCustomer = {the: 'updated customer'};
      mockCustomerCollection.findOneAndUpdate
        .withArgs({ _id: mockId }, { $set: mockUpdates })
        .resolves({ value: mockUpdatedCustomer });

      return repository.updateCustomer(mockId, mockUpdates).then(updatedCustomer => {
        expect(updatedCustomer).to.be.eql(mockUpdatedCustomer);
      });
    });
  });
});