'use strict';

import * as express from 'express';
import * as moment from 'moment';
import { PurchasingOrderModel } from '../models/purchasingOrder';
import { PurchasingOrderItemModel } from '../models/purchasingOrderItem'
import util = require('util')
import { SerialModel } from '../models/serial';

import * as _ from 'lodash';
import { PeriodModel } from '../models/period';
import { BudgetTransectionModel } from '../models/budgetTransection';

const serialModel = new SerialModel();
const router = express.Router();
const model = new PurchasingOrderModel();
const modelItems = new PurchasingOrderItemModel();
const periodModel = new PeriodModel();
const bgModel = new BudgetTransectionModel();

router.get('/budgetyear/:year/:budget_type_id', (req, res, next) => {

  const budgetYear = req.params.year !== 'null' || !req.params.year ? req.params.year : moment().get('year');
  const budget_type_id = req.params.budget_type_id;
  let db = req.db;

  model.getBudgetDetail(db, budgetYear, budget_type_id)
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

router.get('/officers', async (req, res, next) => {
  let db = req.db;
  try {
    let rs: any = await model.officers(db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/getpoId/:sId/:eId/:genericTypeId/:orderStatus', async (req, res, next) => {

  let db = req.db;
  let sId = req.params.sId;
  let eId = req.params.eId;
  let genericTypeId = req.params.genericTypeId;
  let orderStatus = req.params.orderStatus;
  try {
    let rs: any = await model.getPOid(db, sId, eId, genericTypeId, orderStatus);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});
router.get('/getPrintDate/:start_date/:end_date/:genericTypeId/:orderStatus', async (req, res, next) => {

  let db = req.db;
  let start_date = req.params.start_date;
  let end_date = req.params.end_date;
  let genericTypeId = req.params.genericTypeId;
  let orderStatus = req.params.orderStatus;
  try {
    let rs: any = await model.getPrintDate(db, start_date, end_date, genericTypeId, orderStatus);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/officers/:id', async (req, res, next) => {

  let db = req.db;
  let id = req.params.id;
  try {
    let rs: any = await model.officerId(db, id);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});
router.get('/getgenerictypes', async (req, res, next) => {

  let db = req.db;
  try {
    let rs: any = await model.getGenericTypes(db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/officers-by-officeid/:id', async (req, res, next) => {

  let db = req.db;
  let id = req.params.id;
  try {
    let rs: any = await model.officersByTypeId(db, id);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/', async (req, res, next) => {

  let db = req.db;

  try {
    let rs: any = await model.list(db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.error });
  } finally {
    db.destroy();
  }
});

router.get('/get-list-po/:bgSubType', async (req, res, next) => {
  let bgSubType = req.params.bgSubType;
  let db = req.db;

  try {
    let rs: any = await model.getOrderList(db, bgSubType);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.error });
  } finally {
    db.destroy();
  }
});

router.post('/by-status', async (req, res, next) => {
  let db = req.db;
  let status = req.body.status;
  let contract = req.body.contract;
  let query = req.body.query;
  let start_date = req.body.start_date || '';
  let end_date = req.body.end_date || '';
  let limit = req.body.limit || 20;
  let offset = req.body.offset || 0;

  let genericTypeIds = [];

  let g = req.decoded.generic_type_id;
  if (g) {
    genericTypeIds = g.split(',');
  }

  try {
    let rs: any = await model.listByStatus(db, status, contract, query, start_date, end_date, limit, offset, genericTypeIds);
    let rsTotal: any = await model.listByStatusTotal(db, status, contract, query, start_date, end_date, genericTypeIds);

    res.send({ ok: true, rows: rs, total: rsTotal[0].total });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/get-receives/:purchaseOrderId', async (req, res, next) => {

  let db = req.db;
  let purchaseOrderId: any = req.params.purchaseOrderId;

  try {
    let rs: any = await model.getReceives(db, purchaseOrderId);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/get-receives-items/:receiveId', async (req, res, next) => {

  let db = req.db;
  let receiveId: any = req.params.receiveId;

  try {
    let rs: any = await model.getReceiveItems(db, receiveId);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/contracts', async (req, res, next) => {
  let db = req.db;
  let status = req.params.status;

  try {
    let rs: any = await model.listContracts(db, status);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/nocontracts', async (req, res, next) => {
  let db = req.db;
  let status = req.params.status;

  try {
    let rs: any = await model.listNoContracts(db, status);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message })
  } finally {
    db.destroy();
  }
});

router.get('/nocontracts-by-requisition/:id', async (req, res, next) => {

  let db = req.db;
  let id = req.params.id;
  try {
    let rs: any = await model.listNoContractsByRequisitionID(db, id);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.get('/ordercontract/:status', async (req, res, next) => {

  let db = req.db;
  let status = req.params.status;
  try {
    let rs: any = await model.purchaseOrderContract(db, status);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});


router.get('/ordernocontract', async (req, res, next) => {

  let db = req.db;

  try {
    let rs: any = await model.purchaseOrderNoContract(db);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

// save reorder point
router.post('/purchase-reorder', async (req, res, next) => {
  let db = req.db;
  let poItems = req.body.poItems;
  let productItems = req.body.productItems;

  let year = moment().get('year');
  let month = moment().get('month') + 1;

  let isClose = await periodModel.isPeriodClose(db, year, month);

  if (isClose) {
    res.send({ ok: false, error: 'รอบบัญชีถูกปิดแล้ว' })
  } else {
    if (poItems.length && productItems.length) {

      try {
        let _poItems = [];

        for (let v of poItems) {
          let serial = await serialModel.getSerial(db, 'PO');
          let obj: any = {
            purchase_order_id: v.purchase_order_id,
            labeler_id: v.labeler_id,
            is_contract: v.is_contract,
            contract_id: v.contract_id,
            generic_type_id: v.generic_type_id,
            // sub_total: v.sub_total,
            delivery: v.delivery,
            vat_rate: v.vat_rate,
            // vat: v.vat,
            // is_reorder: v.is_reorder,
            budget_year: v.budget_year,
            // total_price: v.total_price,
            order_date: v.order_date,
            purchase_order_number: serial,
            people_user_id: req.decoded.people_user_id
          };
          _poItems.push(obj);
        }

        await modelItems.save(db, productItems);
        await model.save(db, _poItems);

        res.send({ ok: true });

      } catch (error) {
        console.log(error);
        res.send({ ok: false, error: error.message });
      } finally {
        db.destroy();
      }

    } else {
      res.send({ ok: false, error: 'ไม่พบข้อมูลที่ต้องการบันทึก' })
    }
  }

});

router.post('/', async (req, res, next) => {
  const items: any = req.body.items;
  const summary: any = req.body.summary;
  const transaction: any = req.body.budgetTransaction;

  const db = req.db;

  let products: any = [];
  let purchase: any = {};
  let purchaseOrderId: any = moment().add(1, 'ms').format('x');

  if (items.length && summary) {
    try {
      // check period status
      let year = moment(summary.order_date, 'YYYY-MM-DD').get('year');
      let month = moment(summary.order_date, 'YYYY-MM-DD').get('month') + 1;

      let isClose = await periodModel.isPeriodClose(db, year, month);

      if (isClose) {
        res.send({ ok: false, error: 'รอบบัญชีถูกปิดแล้ว ไม่สามารถบันทึกได้' })
      } else {

        let serial
        if (summary.generic_type_id === 1) {
          serial = await serialModel.getSerial(db, 'PO');
        } else if (summary.generic_type_id === 2) {
          serial = await serialModel.getSerial(db, 'POA');
        } else if (summary.generic_type_id === 3) {
          serial = await serialModel.getSerial(db, 'POB');
        } else if (summary.generic_type_id === 4) {
          serial = await serialModel.getSerial(db, 'POC');
        } else if (summary.generic_type_id === 5) {
          serial = await serialModel.getSerial(db, 'POD');
        } else {
          serial = await serialModel.getSerial(db, 'PO');
        }

        purchase.purchase_order_number = serial;
        purchase.purchase_order_status = 'PREPARED';
        purchase.purchase_order_id = purchaseOrderId;
        // purchasing_id: summary.purchasing_id;
        purchase.labeler_id = summary.labeler_id;
        purchase.verify_committee_id = summary.verify_committee_id;
        purchase.order_date = summary.order_date;
        purchase.discount_percent = summary.discount_percent;
        purchase.discount_cash = summary.discount_cash;
        purchase.exclude_vat = summary.exclude_vat;
        // purchase.is_before_vat = summary.is_before_vat;
        purchase.vat_rate = summary.vat_rate;
        purchase.vat = summary.vat;
        purchase.total_price = summary.total_price;
        purchase.egp_id = summary.egp_id ? summary.egp_id : null;
        purchase.budgettype_id = summary.budgettype_id;
        purchase.budget_detail_id = summary.budget_detail_id;
        purchase.generic_type_id = summary.generic_type_id;
        purchase.purchase_method_id = summary.purchase_method_id;
        purchase.purchase_type_id = summary.purchase_type_id;
        purchase.chief_id = summary.chief_id;
        purchase.buyer_id = summary.buyer_id;
        purchase.budget_year = summary.budget_year;
        purchase.comment = summary.comment ? summary.comment : null;
        // is_reorder= summary.is_reorder;
        purchase.ship_to = summary.ship_to ? summary.ship_to : null;
        purchase.vendor_contact_name = summary.vendor_contact_name ? summary.vendor_contact_name : null;
        purchase.delivery = summary.delivery;
        purchase.is_contract = summary.is_contract ? summary.is_contract : null;
        purchase.purchase_order_book_number = summary.purchase_order_book_number ? summary.purchase_order_book_number : null;
        purchase.contract_id = summary.contract_id;

        purchase.people_user_id = req.decoded.people_user_id;

        items.forEach(v => {
          let obj: any = {
            purchase_order_id: purchaseOrderId,
            generic_id: v.generic_id,
            product_id: v.product_id,
            qty: v.qty, // large unit
            unit_price: v.cost,
            unit_generic_id: v.unit_generic_id,
            total_price: v.total_cost,
            total_small_qty: v.total_small_qty,
            giveaway: v.is_giveaway
          }

          products.push(obj);
        });

        let transactionData = {
          purchase_order_id: purchaseOrderId,
          bgdetail_id: transaction.budgetDetailId,
          incoming_balance: transaction.budgetRemain,
          amount: transaction.totalPurchase,
          balance: transaction.remainAfterPurchase,
          date_time: moment().format('YYYY-MM-DD HH:mm:ss'),
          transaction_status: 'SPEND'
        }
        // save
        await model.save(db, purchase);
        await modelItems.save(db, products);
        await bgModel.save(db, transactionData);
        res.send({ ok: true });
      }

    } catch (error) {
      res.send({ ok: false, error: error.message });
    } finally {
      db.destroy();
    }
  } else {
    res.send({ ok: false, error: 'ข้อมูลไม่่ครบถ้วน กรุณาตรวจสอบ' });
  }

});

router.put('/:purchaseOrderId', async (req, res, next) => {
  const items: any = req.body.items;
  const summary: any = req.body.summary;
  const transaction: any = req.body.budgetTransaction;
  const purchaseOrderId: any = req.params.purchaseOrderId;

  const db = req.db;

  let products: any = [];
  let purchase: any = {};
  // let purchaseOrderId: any = moment().add(1, 'ms').format('x');

  if (items.length && summary) {
    try {
      // check period status
      let year = moment(summary.order_date, 'YYYY-MM-DD').get('year');
      let month = moment(summary.order_date, 'YYYY-MM-DD').get('month') + 1;

      let isClose = await periodModel.isPeriodClose(db, year, month);

      if (isClose) {
        res.send({ ok: false, error: 'รอบบัญชีถูกปิดแล้ว ไม่สามารถบันทึกได้' })
      } else {

        purchase.purchase_order_status = 'PREPARED';
        purchase.purchase_order_id = purchaseOrderId;
        // purchasing_id: summary.purchasing_id;
        purchase.labeler_id = summary.labeler_id;
        purchase.verify_committee_id = summary.verify_committee_id;
        purchase.order_date = summary.order_date;
        purchase.discount_percent = summary.discount_percent;
        purchase.discount_cash = summary.discount_cash;
        purchase.exclude_vat = summary.exclude_vat;
        // purchase.is_before_vat = summary.is_before_vat;
        purchase.vat_rate = summary.vat_rate;
        purchase.vat = summary.vat;
        purchase.total_price = summary.total_price;
        purchase.egp_id = summary.egp_id ? summary.egp_id : null;
        purchase.budgettype_id = summary.budgettype_id;
        purchase.budget_detail_id = summary.budget_detail_id;
        purchase.generic_type_id = summary.generic_type_id;
        purchase.purchase_method_id = summary.purchase_method_id;
        purchase.purchase_type_id = summary.purchase_type_id;
        purchase.chief_id = summary.chief_id;
        purchase.buyer_id = summary.buyer_id;
        purchase.budget_year = summary.budget_year;
        purchase.comment = summary.comment ? summary.comment : null;
        // is_reorder= summary.is_reorder;
        purchase.ship_to = summary.ship_to ? summary.ship_to : null;
        purchase.vendor_contact_name = summary.vendor_contact_name ? summary.vendor_contact_name : null;
        purchase.delivery = summary.delivery;
        purchase.is_contract = summary.is_contract ? summary.is_contract : null;
        purchase.purchase_order_book_number = summary.purchase_order_book_number ? summary.purchase_order_book_number : null;
        purchase.update_people_user_id = req.decoded.people_user_id;

        items.forEach(v => {
          let obj: any = {
            purchase_order_id: purchaseOrderId,
            generic_id: v.generic_id,
            product_id: v.product_id,
            qty: v.qty, // large unit
            unit_price: v.cost,
            unit_generic_id: v.unit_generic_id,
            total_price: v.total_cost,
            total_small_qty: v.total_small_qty,
            giveaway: v.is_giveaway
          }

          products.push(obj);
        });

        let transactionData = {
          purchase_order_id: purchaseOrderId,
          bgdetail_id: transaction.budgetDetailId,
          incoming_balance: transaction.budgetRemain,
          amount: transaction.totalPurchase,
          balance: transaction.remainAfterPurchase,
          date_time: moment().format('YYYY-MM-DD HH:mm:ss'),
          transaction_status: 'SPEND'
        }
        // save
        await model.update(db, purchaseOrderId, purchase);
        await modelItems.removePurchaseItem(db, purchaseOrderId);
        await modelItems.save(db, products);

        // check 
        let rsAmount = await bgModel.getCurrentAmount(db, purchaseOrderId, transaction.budgetDetailId);
        if (rsAmount.length) {
          if (rsAmount[0].amount !== transaction.totalPurchase) {
            // revoke transaction
            await bgModel.cancelTransaction(db, purchaseOrderId);
            // save transaction
            await bgModel.save(db, transactionData);
          }
        } else {
          await bgModel.cancelTransaction(db, purchaseOrderId);
          // save transaction
          await bgModel.save(db, transactionData);
        }

        res.send({ ok: true });
      }

    } catch (error) {
      res.send({ ok: false, error: error.message });
    } finally {
      db.destroy();
    }
  } else {
    res.send({ ok: false, error: 'ข้อมูลไม่่ครบถ้วน กรุณาตรวจสอบ' });
  }

});

router.post('/checkApprove', async (req, res, next) => {
  let db = req.db;
  let username = req.body.username;
  let password = req.body.password;
  let action = req.body.action;
  console.log(action, password, username);

  const isCheck = await model.checkApprove(db, username, password, action);
  if (isCheck[0]) {
    res.send({ ok: true })
  } else {
    res.send({ ok: false });
  }
});

router.put('/update-purchase/status', async (req, res, next) => {
  const db = req.db;
  let items = req.body.items;

  let year = moment().get('year');
  let month = moment().get('month') + 1;

  let isClose = await periodModel.isPeriodClose(db, year, month);

  if (isClose) {
    res.send({ ok: false, error: 'รอบบัญชีถูกปิดแล้ว' })
  } else {
    if (items.length) {

      try {
        let data = [];

        for (let v of items) {
          if (v.purchase_order_status === 'CONFIRMED') {
            await model.update(db, v.purchase_order_id, {
              purchase_order_status: v.purchase_order_status,
              confirmed_date: moment().format('YYYY-MM-DD HH:mm:ss')
            });

            let statusLog = {
              purchase_order_id: v.purchase_order_id,
              from_status: v.from_status,
              to_status: v.purchase_order_status,
              people_user_id: req.decoded.people_user_id,
              created_at: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            await model.updateStatusLog(db, statusLog);

          }

          if (v.purchase_order_status === 'APPROVED') {
            await model.update(db, v.purchase_order_id, {
              purchase_order_status: v.purchase_order_status,
              approved_date: moment().format('YYYY-MM-DD HH:mm:ss')
            });

            let statusLog = {
              purchase_order_id: v.purchase_order_id,
              from_status: v.from_status,
              to_status: v.purchase_order_status,
              people_user_id: req.decoded.people_user_id,
              created_at: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            await model.updateStatusLog(db, statusLog);
          }

          if (v.purchase_order_status === 'CANCEL') {
            await model.update(db, v.purchase_order_id, {
              cancel_comment: v.cancel_comment,
              cancel_date: moment().format('YYYY-MM-DD HH:mm:ss'),
              is_cancel: 'Y'
            });

            let statusLog = {
              purchase_order_id: v.purchase_order_id,
              from_status: v.from_status,
              to_status: v.purchase_order_status,
              people_user_id: req.decoded.people_user_id,
              created_at: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            await model.updateStatusLog(db, statusLog);
            await bgModel.cancelTransaction(db, v.purchase_order_id);
          }

          if (v.purchase_order_status === 'PREPARED') {
            await model.update(db, v.purchase_order_id, {
              cancel_comment: null,
              cancel_date: null,
              is_cancel: 'N',
              purchase_order_status: v.purchase_order_status,
            });

            let statusLog = {
              purchase_order_id: v.purchase_order_id,
              from_status: v.from_status,
              to_status: v.purchase_order_status,
              people_user_id: req.decoded.people_user_id,
              created_at: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            await model.updateStatusLog(db, statusLog);
          }

        }

        res.send({ ok: true });
      } catch (error) {
        console.log(error);
        res.send({ ok: false, error: error.message });
      }

    } else {
      res.send({ ok: false, error: 'กรุณาระบุรายการที่ต้องการปรับปรุงข้อมูล' });
    }
  }

});

// router.put('/:purchaseOrderId', async (req, res, next) => {
//   const db = req.db;
//   let id = req.params.id;
//   let items: any = req.body.items;
//   let summary: any = req.body.summary;

//   let products: any = [];
//   let purchase: any = {};

//   let year = moment(summary.order_date, 'YYYY-MM-DD').get('year');
//   let month = moment(summary.order_date, 'YYYY-MM-DD').get('month') + 1;
//   let isClose = await periodModel.isPeriodClose(db, year, month);

//   if (isClose) {
//     res.send({ ok: false, error: 'รอบบัญชีถูกปิดแล้ว' })
//   } else {
//     if (items.length && summary) {
//       try {
//         purchase = {
//           purchase_order_number: summary.purchase_order_number,
//           labeler_id: summary.labeler_id,
//           verify_committee_id: summary.verify_committee_id,
//           order_date: summary.order_date,
//           discount_percent: summary.discount_percent,
//           discount_cash: summary.discount_cash,
//           include_vat: summary.include_vat ? 1 : 0,
//           vat_rate: summary.vat_rate,
//           vat: summary.vat,
//           total_price: summary.total_price,
//           egp_id: summary.egp_id,
//           budgettype_id: summary.budgettype_id,
//           budget_detail_id: summary.budget_detail_id,
//           generic_type_id: summary.generic_type_id,
//           purchase_method: summary.purchase_method,
//           purchase_order_status: summary.purchase_order_status,
//           purchase_type: summary.purchase_type,
//           buyer_fullname: summary.buyer_fullname,
//           chief_fullname: summary.chief_fullname,
//           chief_position: summary.chief_position,
//           buyer_position: summary.buyer_position,
//           chief_id: summary.chief_id,
//           buyer_id: summary.buyer_id,
//           budget_year: summary.budget_year,
//           comment: summary.comment,
//           is_reorder: summary.is_reorder,
//           ship_to: summary.ship_to,
//           vendor_contact_name: summary.vendor_contact_name,
//           delivery: summary.delivery,
//           is_contract: summary.is_contract,
//           purchase_order_book_number: summary.purchase_order_book_number
//         }

//         items.forEach(v => {
//           let obj: any = {
//             purchase_order_id: summary.purchase_order_id,
//             generic_id: v.generic_id,
//             product_id: v.product_id,
//             qty: v.qty, // large unit
//             unit_price: v.cost,
//             unit_generic_id: v.unit_generic_id,
//             total_price: v.total_cost,
//             total_small_qty: v.total_small_qty,
//             giveaway: v.is_giveaway
//           }

//           products.push(obj);
//         });

//         // save
//         await model.update(db, id, purchase);
//         // remove old items
//         await modelItems.removePurchaseItem(db, id);
//         await modelItems.save(db, products);

//         let statusLog = {
//           purchase_order_id: summary.purchase_order_id,
//           from_status: summary.from_status,
//           to_status: summary.purchase_order_status,
//           people_user_id: req.decoded.people_user_id,
//           created_at: moment().format('YYYY-MM-DD HH:mm:ss')
//         };

//         await model.updateStatusLog(db, statusLog);

//         res.send({ ok: true });
//       } catch (error) {
//         res.send({ ok: false, error: error.message });
//       } finally {
//         db.destroy();
//       }
//     } else {
//       res.send({ ok: false, error: 'ข้อมูลไม่่ครบถ้วน กรุณาตรวจสอบ' });
//     }
//   }

// });

router.get('/detail', (req, res, next) => {
  let id = req.query.id;
  let db = req.db;

  model.detail(db, id)
    .then((results: any) => {
      res.send({ ok: true, detail: results[0] })
    })
    .catch(error => {
      console.log(error);
      res.send({ ok: false, error: error })
    })
    .finally(() => {
      db.destroy();
    });

});

router.get('/lastorder/:id', async (req, res, next) => {
  let labeler_id = req.params.id;
  let db = req.db;

  try {
    let rs: any = await model.getLastOrderByLabeler(db, labeler_id);
    res.send({ ok: true, detail: rs[0] })
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
    let rs: any = await model.remove(db, id);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/check-holiday', async (req, res, nex) => {
  let date = req.query.date
  let db = req.db;
  date = moment(date).format('YYYY-MM-DD');
  let dateNotYear = '2000' + moment(date).format('-MM-DD');
  const lastWeek = moment(date).format('d');
  if (lastWeek == '0' || lastWeek == '6') {
    res.send({ ok: false, error: 'วันที่คุณเลือกเป็นวันหยุดราชการ จะสั่งซื้อสินค้าหรือไม่' });
  } else {
    try {
      const rows = await model.getPurchaseCheckHoliday(db, date);
      const row_notYear = await model.getPurchaseCheckHoliday(db, dateNotYear);


      if (rows.length > 0 || row_notYear.length > 0) {
        res.send({ ok: false, error: 'วันที่คุณเลือกเป็นวันหยุดราชการ จะสั่งซื้อสินค้าหรือไม่' });
      } else {
        res.send({ ok: true });
      }
    } catch (error) {
      res.send({ ok: false, error: error.message });
    } finally {
      db.destroy();
    }
  }
});

router.get('/period/status', (async (req, res, next) => {
  let db = req.db;
  let date = req.query.date;
  const month = moment(date).get('month') + 1;
  let year = moment(date).get('year');
  if (month >= 10) {
    year += 1;
  }

  try {
    let rs = await model.getPeriodStatus(db, month, year);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
}));

router.get('/getGeneric', async (req, res, next) => {
  let db = req.db;
  let limit = req.query.limit;
  let offset = req.query.offset;
  let generic_type_id = req.decoded.generic_type_id
  try {
    let rs: any = await model.getGeneric(db, generic_type_id, limit, offset);
    let rsTotal: any = await model.getGenericTotal(db, generic_type_id);
    res.send({ ok: true, rows: rs[0], total: rsTotal[0][0].total });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/getGeneric/search', async (req, res, next) => {
  let db = req.db;
  let limit = req.query.limit;
  let offset = req.query.offset;
  let generic_type_id = req.decoded.generic_type_id
  let query = req.query.query;
  try {
    let rs: any = await model.getGenericSearch(db, generic_type_id, limit, offset, query);
    let rsTotal: any = await model.getGenericTotalSearch(db, generic_type_id, query);
    res.send({ ok: true, rows: rs[0], total: rsTotal[0][0].total });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/getProductHistory/:generic_id', async (req, res, next) => {
  let generic_id = req.params.generic_id
  let db = req.db;
  try {
    let rs: any = await model.getProductHistory(db, generic_id);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/searchGenericHistory', async (req, res, next) => {
  let key = req.query.key
  let db = req.db;
  try {
    let rs: any = await model.searchGenericHistory(db, key);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/change-purchase-date', async (req, res, next) => {
  let purchaseOrderIds = req.body.purchaseOrderIds;
  let purchaseDate = req.body.purchaseDate;

  let db = req.db;

  try {
    let rs: any = await model.changePurchaseDate(db, purchaseOrderIds, purchaseDate);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/sys-report', async (req, res, next) => {
  let db = req.db;
  try {
    let rs: any = await model.getSysReport(db);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

export default router;
