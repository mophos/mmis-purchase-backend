import * as express from 'express';
import * as moment from 'moment';

import { BudgetTransectionModel } from '../models/budgetTransection';
import { PeriodModel } from '../models/period';
const router = express.Router();

const budgetModel = new BudgetTransectionModel();

// router.get('/', (req, res, next) => {

//   let db = req.db;

//   budgetModel.list(db)
//     .then((results: any) => {
//       res.send({ ok: true, rows: results });
//     })
//     .catch(error => {
//       res.send({ ok: false, error: error })
//     })
//     .finally(() => {
//       db.destroy();
//     });
// });

// router.get('/diff/:purchase_order_id', (req, res, next) => {
//   let db = req.db;
//   budgetModel.difference(db, req.params.purchase_order_id)
//     .then((results: any) => {
//       res.send({ ok: true, rows: results });
//     })
//     .catch(error => {
//       res.send({ ok: false, error: error })
//     })
//     .finally(() => {
//       db.destroy();
//     });
// });

// router.post('/', async (req, res, next) => {
//   let params: any = req.body.data;
//   let db = req.db;
//   let diffAmount: number = 0;
//   let balance: number = 0;
//   let data: any = {};

//   try {
//     let budget = await budgetModel.budgetDetailByID(db, params.bgdetail_id);
//     budget = budget[0];
//     let diff = await budgetModel.difference(db, params.purchase_order_id);
//     let list = await budgetModel.budgetDetailByID(db, params.bgdetail_id);
//     let summaryPoByBudgetId = await budgetModel.summaryPoByBudgetId(db, params.bgdetail_id, params.purchase_order_id);
//     let incoming_balance = summaryPoByBudgetId[0].amount;

//     if (summaryPoByBudgetId[0].amount == null) {
//       data.incoming_balance = budget.amount;
//     } else {
//       balance = await budgetModel.incomingBalance(db, params.bgdetail_id);
//       balance = balance[0].balance;
//       data.incoming_balance = balance;
//       data.balance = data.incoming_balance - params.amount;
//     }

//     if (diff.length != 0) {
//       diffAmount = params.amount - diff[0].amount;
//       await budgetModel.updateTransaction(db, diff[0].transection_id);
//       if (diffAmount < 0) data.balance = data.incoming_balance + (diffAmount * -1);
//       if (diffAmount > 0) data.balance = data.incoming_balance - diffAmount;
//       data.difference = diffAmount;
//       data.amount = params.amount;
//     } else {
//       data.amount = params.amount;
//       data.difference = 0;
//       data.balance = data.incoming_balance - params.amount;
//     }

//     data.purchase_order_id = params.purchase_order_id;
//     data.bgdetail_id = params.bgdetail_id;
//     data.budget_year = params.budget_year;
//     data.date_time = moment().format('YYYY-MM-DD HH:mm:ss');
//     data.type = 'spend';

//     await budgetModel.save(db, data);
//     res.send({ ok: true, data: incoming_balance });

//   } catch (error) {
//     res.send({ ok: false, error: error.message });
//   } finally {
//     db.destroy();
//   }

// });

// router.put('/cancel/:id', async (req, res, next) => {
//   let id = req.params.id;
//   let data: any = req.body.data;
//   let db = req.db;
//   if (id) {
//     try {
//       data.balance = data.incoming_balance;
//       let rs: any = await budgetModel.update(db, id, data);
//       res.send({ ok: true, data: data });

//     } catch (error) {
//       console.log(error);
//       res.send({ ok: false, error: error.message })
//     } finally {
//       db.destroy();
//     }
//   } else {
//     res.send({ ok: false, error: 'ข้อมูลไม่สมบูรณ์' }) ;
//   }
// });

// router.put('/:id', async (req, res, next) => {
//   let id = req.params.id;
//   let data: any = req.body.data;
//   let db = req.db;
//   let detail = await budgetModel.detail(db, data.purchase_order_id);
//   detail = detail[0];
//   let budget = await budgetModel.budgetDetailByID(db, data.bgdetail_id);
//   budget = budget[0];
//   if (detail.amount != data.total_price) {
//     let summaryPoByBudgetId = await budgetModel.summaryPoByBudgetId(db, data.bgdetail_id, data.purchase_order_id);
//     let incoming_balance = summaryPoByBudgetId[0].amount;
//     //data.incoming_balance = budget.amount - incoming_balance;
//     data.balance = data.incoming_balance - data.amount;
//   }

//   if (id) {

//     budgetModel.update(db, id, data)
//       .then((results: any) => {
//         res.send({ ok: true, data: data, budget: budget, detail: detail })
//       })
//       .catch(error => {
//         res.send({ ok: false, error: error })
//       })
//       .finally(() => {
//         db.destroy();
//       });
//   } else {
//     res.send({ ok: false, error: 'ข้อมูลไม่สมบูรณ์' }) ;
//   }
// });

// router.get('/detail-active/:id', (req, res, next) => {
//   let id = req.params.id;
//   let db = req.db;

//   budgetModel.detailActive(db, id)
//     .then((results: any) => {
//       res.send({ ok: true, detail: results[0] })
//     })
//     .catch(error => {
//       res.send({ ok: false, error: error })
//     })
//     .finally(() => {
//       db.destroy();
//     });
// });

// router.delete('/:id', (req, res, next) => {
//   let id = req.params.id;
//   let db = req.db;

//   budgetModel.remove(db, id)
//     .then((results: any) => {
//       res.send({ ok: true })
//     })
//     .catch(error => {
//       res.send({ ok: false, error: error })
//     })
//     .finally(() => {
//       db.destroy();
//     });
// });

router.get('/transaction/:budgetDetailId', async (req, res, next) => {
  let db = req.db;
  let budgetDetailId = req.params.budgetDetailId;
  try {
    const rs: any = await budgetModel.getBudgetTransaction(db, budgetDetailId);
    res.send({ ok: true, detail: rs[0] });
  } catch (error) {
    console.log(error)
    res.send({ ok: false, error: error.messgae });
  } finally {
    db.destroy();
  }
});

router.post('/transaction/balance', async (req, res, next) => {
  let db = req.db;
  let budgetDetailId = req.body.budgetDetailId;
  let purchaseOrderId = req.body.purchaseOrderId;

  try {
    const rs: any = await budgetModel.getTransactionBalance(db, budgetDetailId, purchaseOrderId);
    res.send({ ok: true, totalPurchase: rs[0].total_purchase });
  } catch (error) {
    console.log(error)
    res.send({ ok: false, error: error.messgae });
  } finally {
    db.destroy();
  }
});

router.get('/purchase-detail/:purchaseOrderId', async (req, res, next) => {
  let purchaseOrderId = req.params.purchaseOrderId;
  let db = req.db;

  try {
    let detail = await budgetModel.getDetail(db, purchaseOrderId);
    res.send({ ok: true, detail: detail[0] })
    db.destroy();
  } catch (error) {
    res.send({ ok: false, error: error })
  }
});

router.get('/history/:budgetDetailId', async (req, res, next) => {
  let budgetDetailId = req.params.budgetDetailId;
  let db = req.db;

  try {
    let rs = await budgetModel.getHistory(db, budgetDetailId);
    res.send({ ok: true, rows: rs })
    db.destroy();
  } catch (error) {
    res.send({ ok: false, error: error })
  }
});

// router.get('/edit/:budgetDetailId', async (req, res, next) => {
//   let budgetDetailId = req.params.budgetDetailId;
//   let db = req.db;

//   try {
//     let rs = await budgetModel.edit(db, budgetDetailId);
//     for (let i = 0; i < rs.length; i++) {
//       if (rs[i].transection_id == 1039) {
//         rs[i].incoming_balance = rs[i].incoming_balance - 510000
//       }
//       rs[i].balance = rs[i].incoming_balance - rs[i].amount
//       if (i < rs.length - 1) {
//         if (rs[i].transaction_status == 'SPEND') {
//           rs[i + 1].incoming_balance = rs[i].balance
//         } else {
//           rs[i + 1].incoming_balance = rs[i].incoming_balance
//         }
//       }
//       await budgetModel.update(db, rs[i].incoming_balance, rs[i].balance, rs[i].transection_id)
//     }
//     console.log(rs.length);
//     res.send({ ok: true, rows: rs })
//     db.destroy();
//   } catch (error) {
//     res.send({ ok: false, error: error })
//   }
// });

export default router;