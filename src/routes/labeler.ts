'use strict';

import * as express from 'express';
import * as moment from 'moment';

import { LabelerModel } from '../models/labeler';

const router = express.Router();

const model = new LabelerModel();

router.get('/', async (req, res, next) => {

  let db = req.db;

  try {
    let rs: any = await model.list(db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/autocomplete', async (req, res, next) => {
  let db = req.db;
  let q = req.query.query;  
  try {
    let rs: any = await model.autoComplete(db, q);
    if(!rs[0].fullname) rs[0].fullname = rs[0].labeler_name
    res.send(rs);
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.post('/', async (req, res, next) => {
  let datas = req.body;
  let db = req.db;

  try {
    let rs: any = await model.save(db, datas);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
  
});

router.put('/:id', async (req, res, next) => {
  let id = req.params.id;
  let typeName = req.body.typeName;

  let db = req.db;

  if (id) {
    let datas: any = {
      type_name: typeName
    }

    try {
      await model.update(db, id, datas);
      res.send({ ok: true });
    } catch (error) {
      res.send({ ok: false, error: error.message });
    } finally {
      db.destroy();
    }
    
  } else {
    res.send({ ok: false, error: 'ข้อมูลไม่สมบูรณ์' }) ;
  }
});

router.get('/detail/:id', async (req, res, next) => {
  let id = req.params.id;
  let db = req.db;

  try {
    let rs: any = await model.detail(db, id);
    res.send({ ok: true, detail: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.delete('/:id', async (req, res, next) => {
  let id = req.params.id;
  let db = req.db;

  try {
    await model.remove(db, id);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

export default router;