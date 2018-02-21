'use strict';

import * as express from 'express';
import * as moment from 'moment';

import { BudgetTransectionModel } from '../models/budgetTransection';
import { PeriodModel } from '../models/period';
const router = express.Router();

const model = new BudgetTransectionModel();

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

router.get('/diff/:purchase_order_id', (req, res, next) => {
  let db = req.db;
  model.difference(db, req.params.purchase_order_id)
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



router.post('/', async (req, res, next) => {
  let params: any = model.load(req);
  let db = req.db;
  let diffAmount: number = 0;
  let balance: number = 0;
  let data: any = {};

  try {
    let budget = await model.budgetDetailByID(db, params.bgdetail_id);
    budget = budget[0];
    let diff = await model.difference(db, params.purchase_order_id);
    let list = await model.budgetDetailByID(db, params.bgdetail_id);
    let summaryPoByBudgetId = await model.summaryPoByBudgetId(db, params.bgdetail_id, params.purchase_order_id);
    let incoming_balance = summaryPoByBudgetId[0].amount;

    if (summaryPoByBudgetId[0].amount == null) {
      data.incoming_balance = budget.amount;
    } else {
      balance = await model.incomingBalance(db, params.bgdetail_id);
      balance = balance[0].balance;
      data.incoming_balance = balance;
      data.balance = data.incoming_balance - params.amount;
    }

    if (diff.length != 0) {
      diffAmount = params.amount - diff[0].amount;
      await model.updateTransaction(db, diff[0].transection_id);
      if (diffAmount < 0) data.balance = data.incoming_balance + (diffAmount * -1);
      if (diffAmount > 0) data.balance = data.incoming_balance - diffAmount;
      data.difference = diffAmount;
      data.amount = params.amount;
    } else {
      data.amount = params.amount;
      data.difference = 0;
      data.balance = data.incoming_balance - params.amount;
    }

    data.purchase_order_id = params.purchase_order_id;
    data.bgdetail_id = params.bgdetail_id;
    data.budget_year = params.budget_year;
    data.date_time = moment().format('YYYY-MM-DD HH:mm:ss');
    data.type = 'spend';

    await model.save(db, data);
    res.send({ ok: true, data: incoming_balance });

  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.put('/cancel/:id', async (req, res, next) => {
  let id = req.params.id;
  let data: any = model.load(req);
  let db = req.db;
  if (id) {
    try {
      data.balance = data.incoming_balance;
      let rs: any = await model.update(db, id, data);
      res.send({ ok: true, data: data });

    } catch (error) {
      console.log(error);
      res.send({ ok: false, error: error.message })
    } finally {
      db.destroy();
    }
  } else {
    res.send({ ok: false, error: 'ข้อมูลไม่สมบูรณ์' }) ;
  }
});

router.put('/:id', async (req, res, next) => {
  let id = req.params.id;
  let data: any = model.load(req);
  let db = req.db;
  let detail = await model.detail(db, data.purchase_order_id);
  detail = detail[0];
  let budget = await model.budgetDetailByID(db, data.bgdetail_id);
  budget = budget[0];
  if (detail.amount != data.total_price) {
    let summaryPoByBudgetId = await model.summaryPoByBudgetId(db, data.bgdetail_id, data.purchase_order_id);
    let incoming_balance = summaryPoByBudgetId[0].amount;
    //data.incoming_balance = budget.amount - incoming_balance;
    data.balance = data.incoming_balance - data.amount;
  }

  if (id) {

    model.update(db, id, data)
      .then((results: any) => {
        res.send({ ok: true, data: data, budget: budget, detail: detail })
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

router.get('/detail/:id', async (req, res, next) => {
  let id = req.params.id;
  let db = req.db;
  try {
    let detail = await model.detail(db, id);
    res.send({ ok: true, detail: detail[0] })
    db.destroy();
  } catch (error) {
    res.send({ ok: false, error: error })
  }
});
router.get('/_detail/:id/:year', async (req, res, next) => {
  let id = req.params.id;
  let year = req.params.year;
  let db = req.db;
  try {
    let detail = await model._detail(db, id, year);
    if (detail[0].amount == null) detail[0].amount = 0
    res.send({ ok: true, detail: detail[0] })
    db.destroy();
  } catch (error) {
    res.send({ ok: false, error: error })
  }
});

router.get('/detail-active/:id', (req, res, next) => {
  let id = req.params.id;
  let db = req.db;

  model.detailActive(db, id)
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

router.get('/transaction/:budgetYear/:budgetDetailId', async (req, res, next) => {
  let db = req.db;
  let budgetYear = req.params.budgetYear;
  let budgetDetailId = req.params.budgetDetailId;
  try {
    const rs: any = await model.getBudgetTransaction(db, budgetYear, budgetDetailId);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    console.log(error)
    res.send({ ok: false, error: error.messgae });
  } finally {
    db.destroy();
  }
});

router.get('/transaction/:pid', async (req, res, next) => {
  let db = req.db;
  let pid = req.params.pid;

  try {
    const rs: any = await model.getPotransaction(db, pid);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    console.log(error)
    res.send({ ok: false, error: error.messgae });
  } finally {
    db.destroy();
  }
});

export default router;