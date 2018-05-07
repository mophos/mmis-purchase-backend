'use strict';

import * as express from 'express';
import * as moment from 'moment';

import { CommitteePeopleModel } from '../models/committeePeople';

const router = express.Router();
const model = new CommitteePeopleModel();

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

router.get('/all/:id', async (req, res, next) => {
  let db = req.db;
  let id = req.params.id;

  try {
    let rs: any = await model.listWithPeopleByCommitteeId(db, id);
    console.log(rs);

    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.post('/', (req, res, next) => {
  let datas = req.body.data;

  let db = req.db;

  model.save(db, datas)
    .then((results: any) => {
      res.send({ ok: true, rows: results })
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
  let typeName = req.body.typeName;

  let db = req.db;

  if (id) {
    let datas: any = {
      type_name: typeName
    }

    model.update(db, id, datas)
      .then((results: any) => {
        res.send({ ok: true })
      })
      .catch(error => {
        res.send({ ok: false, error: error })
      })
      .finally(() => {
        db.destroy();
      });
  } else {
    res.send({ ok: false, error: 'ข้อมูลไม่สมบูรณ์' }) ;
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

router.delete('/bycommitee/:id', (req, res, next) => {
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