'use strict';

import * as express from 'express';
import * as moment from 'moment';
import { PurchasingModel } from '../models/purchasing';
import util = require('util')

const router = express.Router();
const model = new PurchasingModel();

router.get('/', (req, res, next) => {

  let db = req.db;

  model.list(db,100)
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

router.post('/', (req, res, next) => {
  let data = model.load(req);
  let db = req.db;

    model.save(db, data)
    .then((results: any) => {
      res.send({ ok: true })
    })
    .catch(error => {
      res.send({ ok: false, error: error })
    })
    .finally(() => {
      db.destroy();
    });
    
});

router.put('/:id', (req, res, next) => {
  let id = req.params.id;
  let data = model.load(req);
  let db = req.db;
  if(id) {
    model.update(db, id, data)
      .then((results: any) => {
        res.send({ ok: true })
      })
      .catch(error => {
        res.send({ ok: false, error: error })
      })
      .finally(() => {
        db.destroy();
      });
  }
});

router.put('/updatebyfield/:id', (req, res, next) => {
  let id = req.params.id;
  let data = model.load(req);
  let db = req.db;
  if(data.purchasing_id){
    model.update(db, id, data)
      .then((results: any) => {
        res.send({ ok: true })
      })
      .catch(error => {
        res.send({ ok: false, error: error })
      })
      .finally(() => {
        db.destroy();
   });
  }else{
    res.status(400).send({ ok: false, error: '400 Bad Request' });
  }
});

router.get('/detail/:id', (req, res, next) => {
  let id = req.params.id;
  let db = req.db;

  model.detail(db, id)
    .then((results: any) => {
      res.send({ ok: true, detail: results[0] })
    })
    .catch(error => {
      res.send({ ok: false, error: error })
    })
    .finally(() => {
      db.destroy();
    });
    
});

router.delete('/:id', (req, res, next) => {
  let id = req.params.id;
  let db = req.db;

  model.remove(db, id)
    .then((results: any) => {
      res.send({ ok: true })
    })
    .catch(error => {
      res.send({ ok: false, error: error })
    })
    .finally(() => {
      db.destroy();
    });
});

export default router;