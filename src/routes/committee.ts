'use strict';

import * as express from 'express';
import * as moment from 'moment';
import { CommitteeModel } from '../models/committee';
import util = require('util')

const router = express.Router();
const model = new CommitteeModel();

router.get('/', (req, res, next) => {

  let db = req.db;

  model.list(db, 100)
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
router.get('/getcommittee/:bidId', (req, res, next) => {

  let db = req.db;
  let id = req.params.bidId;

  model.getCommittee(db, id)
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
router.get('/bid', (req, res, next) => {

  let db = req.db;

  model.listbid(db, 100)
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
router.get('/listbidtype', (req, res, next) => {

  let db = req.db;

  model.listbidtype(db, 100)
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
router.delete('/removecommitteebid', (req, res, next) => {

  let db = req.db;
  let id = req.query.id;
  model.removeCommitteeBid(db, id)
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
router.put('/updatecommitteebid', (req, res, next) => {

  let db = req.db;
  let id = req.body.id;
  let bid_id = req.body.bid_id;
  model.updateCommitteeBid(db, id, bid_id)
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

router.get('/active', (req, res, next) => {

  let db = req.db;

  model.listActive(db, 100)
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
  if (model.validate(req, res)) {
    model.save(db, data)
      .then((results: any) => {
        res.send({ ok: true, rows: results })
      })
      .catch(error => {
        res.send({ ok: false, error: error })
      })
      .finally(() => {
        db.destroy();
      });
  }
});

router.put('/:id', (req, res, next) => {
  let id = req.params.id;
  let data = model.load(req);
  let db = req.db;
  if (model.validate(req, res)) {
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

router.put('/remove/:id', (req, res, next) => {
  let id = req.params.id;
  let db = req.db;
  model.updateIsdelete(db, id)
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