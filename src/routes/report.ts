'use strict';

import * as express from 'express';
import * as moment from 'moment';
import * as fse from 'fs-extra';
import * as wrap from 'co-express';
import * as _ from 'lodash';
import { PurchasingOrderReportModel } from '../models/reports/purchasingOrder';
import { RequisitionOrderReportModel } from '../models/reports/requisitionOrder';

const model = new PurchasingOrderReportModel();
const modelPr = new RequisitionOrderReportModel();
const router = express.Router();

router.get('/requisition', wrap(async (req, res, next) => {
  let db = req.db;
  moment.locale('th');
  let purchaOrderId = req.query.purchase_order_id;
  let type = req.query.type;
  let purchasing = await model.purchasing(db, purchaOrderId);
  purchasing = purchasing[0];
  let committeesVerify = await model.getCommitteeVerify(db, purchasing.verify_committee_id);
  let committeesCheck = await model.getCommitteeVerify(db, purchasing.check_price_committee_id);
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0][0].count || 0;

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail.hospname;
  let orderDate = moment(purchasing.order_date).format('D MMMM ') + (moment(purchasing.order_date).get('year') + 543);

  let purchasingOfficer = await model.getPurchasingOfficer(db);
  let inventoryBossName = _.find(purchasingOfficer, { 'type_id': 2 });
  let directorName = _.find(purchasingOfficer, { 'type_id': 1 });

  res.render('requisition', {
    committeesVerify: committeesVerify,
    committeesCheck: committeesVerify,
    hospitalName: hospitalName,
    orderDate: orderDate,
    purchasing: purchasing,
    type: type,
    pricetext: model.bahtText(purchasing.total_price) || 0,
    count: count,
    purchasingOfficer: purchasingOfficer,
    inventoryBossName: inventoryBossName,
    directorName: directorName
  });
}));

router.get('/getProductHistory', wrap(async (req, res, next) => {
  let db = req.db;
  let generic_code = req.query.generic_code;
  generic_code = Array.isArray(generic_code) ? generic_code : [generic_code];
  ////ชื่อโรงพยาบาล//////////
  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail.hospname;
  let hostel = hosdetail.telephone;
  let hosaddress = hosdetail.address;
  moment.locale('th');
  let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
  let tradingList: any = []
  for (let i in generic_code) {
    let rs: any = await model.getProductHistory(db, generic_code[i]);
    if (rs[0].length > 0) {
      tradingList.push(rs[0])
    }
  }
  _.forEach(tradingList, values => {
    _.forEach(values, value => {
      value.amount_qty = model.commaQty(value.qty * value.conversion_qty)
      value.qty = model.commaQty(value.qty)
      value.conversion_qty = model.commaQty(value.conversion_qty)
      value.unit_price = model.comma(value.unit_price)
      value.total_price = model.comma(value.total_price)

    })
  })
  res.render('purchaseHistory', {
    hospitalName: hospitalName,
    date: nDate,
    tradingList: tradingList
  });
}));

export default router;