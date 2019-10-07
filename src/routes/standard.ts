'use strict';

import * as express from 'express';
import * as moment from 'moment';

import { StandardModel } from '../models/standard';

const router = express.Router();

const stdModel = new StandardModel();

router.get('/generic-units/:genericId', async (req, res, next) => {

  let db = req.db;
  let genericId: any = req.params.genericId;

  try {
    let rs: any = await stdModel.getUnitPackages(db, genericId);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.get('/generic-units/:genericId/:productId', async (req, res, next) => {

  let db = req.db;
  let genericId: any = req.params.genericId;
  let productId: any = req.params.productId;

  try {
    let rs: any = await stdModel.getUnitPackagesPurchase(db, genericId, productId);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.get('/bid-types', async (req, res, next) => {

  let db = req.db;

  try {
    let rs: any = await stdModel.getBidTypes(db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.get('/budget-types', async (req, res, next) => {

  let db = req.db;
  let warehouseId = req.decoded.warehouseId;

  try {
    let rs: any = await stdModel.getBudgetTypes(db, warehouseId);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.get('/bid-process', async (req, res, next) => {

  let db = req.db;

  try {
    let rs: any = await stdModel.getBidProcess(db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.get('/budget-year/:budgetTypeId/:year', async (req, res, next) => {
  const budgetYear = req.params.year !== 'null' || !req.params.year || req.params.year !== 'undefined' ? req.params.year : moment().get('year');
  const budgetTypeId = req.params.budgetTypeId;
  let warehouseId = req.decoded.warehouseId;
  let db = req.db;

  try {
    let rs: any = await stdModel.getBudgetDetail(db, budgetYear, budgetTypeId, warehouseId);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

export default router;