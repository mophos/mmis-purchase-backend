'use strict';

import * as express from 'express';
// import * as co from 'co-express';
import * as moment from 'moment';
import { ProductsModel } from '../models/products';
import util = require('util');
var _ = require('lodash');

const router = express.Router();
const model = new ProductsModel();

router.get('/', (req, res, next) => {

  let db = req.db;
  let promis;
  return model.list(db)
    .then((results: any) => {
      res.send({ ok: true, rows: results[0] });
    })
    .catch(error => {
      res.send({ ok: false, error: error })
    })
    .finally(() => {
      db.destroy();
    });
});

router.post('/orderspoint', async (req, res, next) => {
  let db = req.db;
  let q = req.query.q;
  let contract = req.query.contract;
  let minmax = req.query.minmax;
  let generictype = req.query.generictype;
  let limit = +req.body.limit || 50;
  let offset = +req.body.offset || 0;

  // let count = await model.orderspoint(db, q, contract, minmax, generictype, true, limit, offset);
  // let result = await model.orderspoint(db, q, contract, minmax, generictype, false, limit, offset);
  try {
    let rs: any = await model.getOrderPoint(db, q, generictype, limit, offset);
    let rsCount: any = await model.getTotalOrderPoint(db, q, generictype);
    res.send({
      ok: true,
      rows: rs,
      total: rsCount.length
    });

  } catch (error) {
    res.send({ ok: false, error: error.message });    
  } finally {
    db.destroy();
  }
});

router.get('/orderspoint/product-list-by-generic/:genericId', async (req, res, next) => {
  let db = req.db;
  let genericId = req.params.genericId;

  try {
    let rs: any = await model.getOrderProductListByGeneric(db, genericId);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });    
  } finally {
    db.destroy();
  }
});

router.get('/byplaning/:year', (req, res, next) => {
  let year = req.params.year;
  let db = req.db;
  let promis;
  return model.byPlaning(db, year)
    .then((results: any) => {
      res.send({ ok: true, rows: results });
    })
    .catch(error => {
      res.send({ ok: false, error: error })
    })
    .finally(() => {
      db.destroy();
    });
});

router.get('/allproduct', (req, res, next) => {

  let db = req.db;
  let promis;
  return model.allProduct(db)
    .then((results: any) => {
      res.send({ ok: true, rows: results });
    })
    .catch(error => {
      res.send({ ok: false, error: error })
    })
    .finally(() => {
      db.destroy();
    });
});

router.get('/products', (req, res, next) => {
  let db = req.db;
  let promis;
  return model.products(db)
    .then((results: any) => {
      res.send({ ok: true, rows: results });
    })
    .catch(error => {
      res.send({ ok: false, error: error })
    })
    .finally(() => {
      db.destroy();
    });
});

router.get('/labeler', (req, res, next) => {
  let db = req.db;
  let id = req.query.labeler_id;
  let q = req.query.query;
  let promis;
  return model.productsByLabeler(db, id, q)
    .then((results: any) => {
      res.send(results);
    })
    .catch(error => {
      res.send({ ok: false, error: error })
    })
    .finally(() => {
      db.destroy();
    });
});

router.get('/search/autocomplete-labeler', async (req, res, next) => {
  let db = req.db;
  let id = req.query.labelerId;
  let q = req.query.q;

  try {
    let rs: any = await model.productsByLabeler(db, id, q);
    console.log(rs);
    res.send(rs);
  } catch (error) {
    res.send({ ok: false, error: error });
  } finally {
    db.destroy();
  }
  
});

router.post('/productsbylabeler/:id', async (req, res, next) => {
  let db = req.db;
  let id = req.params.id;
  let q = req.body.q;

  try {
    let rs: any = await model.productsByLabeler(db, id, q);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.get('/type/:type', async (req, res, next) => {
  let db = req.db;
  let type = req.params.type;
  try {
    let rs: any = await model.listByGenericType(db, type);
    res.send({ ok: type, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/bycontract', async (req, res, next) => {

  let db = req.db;

  try {
    let rs: any = await model.byContract(db);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.get('/withoutcontract', async (req, res, next) => {

  let db = req.db;

  try {
    let rs: any = await model.withOutContract(db);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.get('/generic', async (req, res, next) => {

  let db = req.db;

  try {
    let rs: any = await model.genericPlainning(db);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});
router.post('/types', async (req, res, next) => {
  let db = req.db;
  let types = req.body.types;
  try {
    let rs: any = await model.types(db,types);
    res.send({ ok: true, rows: rs});
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
  
});

export default router;