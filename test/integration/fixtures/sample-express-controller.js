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