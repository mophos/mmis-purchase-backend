'use strict';

import * as express from 'express';
import * as moment from 'moment';

import { ContractProductModel } from '../models/contractProduct';
const router = express.Router();

const model = new ContractProductModel();

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


export default router;