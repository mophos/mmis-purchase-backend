'use strict';

import * as express from 'express';
import * as moment from 'moment';

import { UnitModel } from '../models/unit';

const router = express.Router();

const model = new UnitModel();

router.get('/', (req, res, next) => {

  let db = req.db;

  model.list(db)
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

router.get('/byproduct/:id', (req, res, next) => {

  let db = req.db;
  let id = req.params.id

  model.byProduct(db,id)
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

router.get('/bygeneric/:id', (req, res, next) => {

  let db = req.db;
  let id = req.params.id

  model.byGeneric(db,id)
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

router.get('/detail/:id', (req, res, next) => {

  let db = req.db;
  let id = req.params.id

  model.detail(db,id)
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



export default router;