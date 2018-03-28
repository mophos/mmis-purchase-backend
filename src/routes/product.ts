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

router.post('/reorderpoint/trade', async (req, res, next) => {
  let db = req.db;
  let warehouseId = req.decoded.warehouseId;
  let genericTypeId = req.body.genericTypeId;
  let limit = +req.body.limit || 20;  
  let offset = +req.body.offset || 0;  
  let query = req.body.query || '';

  try {
    let rs: any = await model.getReOrderPointTrade(db, warehouseId, genericTypeId, limit, offset, query);
    let rsTotal: any = await model.getReOrderPointTradeTotal(db, warehouseId, genericTypeId, query);
    res.send({ ok: true, rows: rs, total: rsTotal.length });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.post('/save-reserved', async (req, res, next) => {
  let db = req.db;
  let items = req.body.items;

  let _items: any = [];
  items.forEach(v => {
    let obj: any = {};
    obj.product_id = v.product_id;
    obj.generic_id = v.generic_id;
    obj.people_user_id = req.decoded.people_user_id;
    obj.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
    _items.push(obj);
  });

  // save items
  try {
    await model.saveReservedProducts(db, _items);
    res.send({ ok: true });
  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/orderspoint', async (req, res, next) => {
  let db = req.db;
  let q = req.body.q;
  let contract = req.body.contract;
  let generictype = req.body.generictype;
  let limit = +req.body.limit || 50;
  let offset = +req.body.offset || 0;

  let warehouseId = req.decoded.warehouseId;

  let genericTypeIds = [];

  if (generictype === null || generictype === 'null' || generictype === '') {
    let g = req.decoded.generic_type_id;
    if (g) {
      genericTypeIds = g.split(',');
    }
  } else {
    genericTypeIds.push(generictype);
  }
 
  try {
    let rs: any = await model.getOrderPoint(db, warehouseId, q, genericTypeIds, limit, offset);
    let rsCount: any = await model.getTotalOrderPoint(db, warehouseId, q, genericTypeIds);
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
  let warehouseId = req.decoded.warehouseId;

  try {
    let rs: any = await model.getOrderProductListByGeneric(db, warehouseId, genericId);
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
    if (rs.length) {
      res.send(rs);
    } else {
      res.send([]);
    }
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