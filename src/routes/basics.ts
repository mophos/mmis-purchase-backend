'use strict';

import * as express from 'express';
import * as moment from 'moment';

import { BasicModel } from '../models/basic';

const router = express.Router();

const basicModel = new BasicModel();

router.get('/units/generic-units/:genericId', async (req, res, next) => {

  let db = req.db;
  let genericId: any = req.params.genericId;

  try {
    let rs: any = await basicModel.getUnitPackages(db, genericId);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
    
});

export default router;