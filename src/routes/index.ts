'use strict';

import * as express from 'express';
import * as moment from 'moment';
import * as fse from 'fs-extra';
import * as wrap from 'co-express';
import * as _ from 'lodash';
import { PurchasingOrderReportModel } from '../models/reports/purchasingOrder';
import { RequisitionOrderReportModel } from '../models/reports/requisitionOrder';
import { log } from 'util';
import { each } from 'bluebird';
// import { load } from 'mime';

const model = new PurchasingOrderReportModel();
const modelPr = new RequisitionOrderReportModel();
const router = express.Router();

router.get('/', (req, res, next) => {
  res.send({ ok: true, message: 'Welcome to Purchasing API server' });
});

router.get('/version', (req, res, next) => {
  res.send({ ok: true, version: 'v1.0.0', build: '20170603' });
});

router.get('/report/purchasingorder', wrap(async (req, res, next) => {
  let purchasOrderId = req.query.orderId;
  let db = req.db;

  let results = await model.purchasingOrder(db, purchasOrderId)
  results = results[0]
  let purchasingOfficer = await model.getPurchasingOfficer(db);
  let getchief = await model.purchasing2Chief(db, purchasOrderId);
  getchief = getchief[0].chief_fullname;
  let hospname = await model.hospital(db)
  hospname = hospname[0].hospname
  let date = model.prettyDate(results[0].created_date)
  let lname = results[0].labeler_name
  let sum: any = 0;
  let chief = 0;
  let pid = results[0].purchase_order_number
  let poraor = hospname[0].managerName
  // if (results[0].bid_name.substring(0, 11) == 'จัดซื้อร่วม' || results[0].bid_name.substring(0, 7) == 'สอบราคา') {
  //   getchief = poraor.title + poraor.fname + "  " + poraor.lname
  //   chief = 1
  // } else {
  //   chief = 2
  // }
  // if (getchief == "") {
  //   chief = 3
  // }
  results.forEach(value => {
    sum += value.total;
    value.unit = model.comma(value.unit);
    value.total = model.comma(value.total);
  });
  let sumtext = model.bahtText(sum);
  sum = model.comma(sum);
  if (chief == null || sumtext == null || pid == null || hospname == null || results == null || lname == null || date == null || sum == null || getchief == null)
    res.render('error404')

  let cposition = await model.getPosition(db, results[0].chief_id);

  res.render('purchase_order_single', {
    chief: chief,
    cposition: cposition[0],
    sumtext: sumtext,
    pid: pid,
    hospname: hospname,
    pOrder: results,
    lname: lname,
    date: date,
    sum: sum,
    getchief: getchief
  });
}));

router.get('/report/requisitionorder/:orderId', wrap(async (req, res, next) => {
  let db = req.db;
  let orderId = req.params.orderId;

  let detail: any[] = await modelPr.requisitionItem(db, orderId);
  let detail1: any[] = await modelPr.name(db, orderId);
  let hospname = await model.hospital(db);
  hospname = hospname[0].hospname
  detail = detail[0]
  detail1 = detail1[0]
  if (detail === undefined) res.render('error404')
  if (detail1 === undefined) res.render('error404')
  let date = model.prettyDate(detail[0].order_date);
  let lname = (detail[0].labeler_name)
  let bgname = (detail[0].bgtype_name)
  let requisitionItem = detail;
  let name = detail1;
  // console.log(name);

  res.render('requisition_order', { hospname: hospname, requisitionItem: requisitionItem, date: date, name: name, lname: lname, bgname: bgname });
}));

router.get('/report/agree', wrap(async (req, res, next) => {
  let db = req.db;
  let hospname = await model.hospital(db);

  hospname = hospname[0].hospname
  res.render('agree', { hospname: hospname })
}));

router.get('/report/purchase', wrap(async (req, res, next) => {
  res.render('purchase')
}));

router.get('/report/purchaseRequset', wrap(async (req, res, next) => {
  res.render('purchaseRequset')
}));

//======================================================================
router.get('/report/list/purchaseSelec', wrap(async (req, res, next) => {
  let generic_type_id = req.query.generic_type_id;
  // let warehouseId = req.decoded.warehouseId;
  
  let db = req.db;

  ////// แก้ไขคลัง decoded warehouseId //////
  let results = await model.getOrderPoint(db, 505, generic_type_id);
  let hospname = await model.hospital(db);
  results = results[0]
  if (results[0] === undefined) res.render('error404')
  hospname = hospname[0].hospname
  let nDate = model.prettyDate(new Date())
  let i = 0;
  let fill = [];
  results.forEach(value => {
    fill[i] = ((value.max_qty - value.remain_qty) / value.qty).toFixed(0);
    value.remain_qty = (value.remain_qty / value.qty).toFixed(0);
    if (value.qty === null) value.qty = 0
    // if(value.unit_name===null) value.unit_name=0
    if (value.min_qty === null) value.min_qty = 0
    i++;
  });

  console.log('===========', fill)
  moment.locale('th');
  let sdate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543);

  res.render('listpurchase', { fill: fill, nDate: nDate, hospname: hospname, results: results, sdate: sdate })
}));

router.get('/report/list/purchase/:startdate/:enddate', wrap(async (req, res, next) => {
  let startdate = req.params.startdate;
  let enddate = req.params.enddate;
  let db = req.db;
  let results = await model.lPurchase(db, startdate, enddate);
  let hospname = await model.hospital(db);
  results = results[0]
  if (results[0] === undefined) res.render('error404')
  hospname = hospname[0].hospname
  let nDate = model.prettyDate(new Date())
  results.forEach(value => {
    if (value.qty === null) value.qty = 0
    // if(value.unit_name===null) value.unit_name=0
    if (value.min_qty === null) value.min_qty = 0
  });
  moment.locale('th');
  let sdate = moment(startdate).format('D MMMM ') + (moment(startdate).get('year') + 543);
  let edate = moment(enddate).format('D MMMM ') + (moment(enddate).get('year') + 543);

  res.render('listpurchase', { nDate: nDate, hospname: hospname, results: results, sdate: sdate, edate: edate })
}));

router.get('/report/total/purchase/:createDate', wrap(async (req, res, next) => {
  let createDate = req.params.createDate;
  let db = req.db;
  let nDate = createDate
  createDate = '%' + createDate + '%'
  // console.log(createDate);

  let results = await model.tPurchase(db, createDate);
  let hospname = await model.hospital(db);
  results = results[0]
  hospname = hospname[0].hospname
  moment.locale('th')
  nDate = moment(nDate).format('MMMM ') + (moment(nDate).get('year') + 543);
  // let date = model.prettyDate(results[0].created_date);
  let sum = 0
  results.forEach(value => {
    value.created_date = model.prettyDate(value.created_date);
    sum += value.total_price
    value.total_price = (value.total_price).toFixed(2)
  });

  res.render('totalpurchase', {
    nDate: nDate,
    hospname: hospname,
    results: results,
    sum: sum.toFixed(2)
  })
}));

router.get('/report/type/purchase', wrap(async (req, res, next) => {
  res.render('typepurchase')
}));

router.get('/report/month/purchase', wrap(async (req, res, next) => {
  let month = req.params.month;
  let db = req.db;

  let results = await model.mPurchase(db);
  let hospname = await model.hospital(db);
  results = results[0]
  hospname = hospname[0].hospname
  let nDate = model.prettyDate(new Date())
  // let date = model.prettyDate(results[0].created_date);
  let sum = 0
  let sum1 = 0
  results.forEach(value => {
    if (value.generic_type_id == 1) sum += value.amount
    if (value.generic_type_id > 1) sum1 += value.amount
  });
  let total = sum + sum1;

  res.render('monthpurchase', { nDate: nDate, total: total, results: results, hospname: hospname, sum: sum, sum1: sum1 })
}));

router.get('/report/process/purchase/:startdate/:enddate', wrap(async (req, res, next) => {
  let startdate = req.params.startdate;
  let enddate = req.params.enddate;
  let db = req.db;
  let results = await model.pPurchase(db, startdate, enddate);
  let hospname = await model.hospital(db);
  results = results[0]
  hospname = hospname[0].hospname
  let nDate = model.prettyDate(new Date())
  moment.locale('th');
  let dates = moment(startdate).format('D MMMM ') + (moment(startdate).get('year') + 543);
  let daten = moment(enddate).format('D MMMM ') + (moment(enddate).get('year') + 543);
  let sum = 0
  let sum1 = 0
  let sum2 = 0

  results.forEach(value => {
    sum += value.po
    sum1 += value.list
    sum2 += value.cost
    value.cost = (value.cost).toFixed(2)
  });
  // console.log(sum + "bb" + sum1 + sum2)

  res.render('processpurchase', { results: results, hospname: hospname, daten: daten, dates: dates, sum: sum, sum1: sum1, sum2: sum2 })
}));

router.get('/report/purchasing/:startdate/:enddate', wrap(async (req, res, next) => {
  let startdate = req.params.startdate;
  let enddate = req.params.enddate;
  let db = req.db;
  let results = await model.pPurchasing(db, startdate, enddate);
  // console.log(results)
  let hospname = await model.hospital(db);
  results = results[0]
  hospname = hospname[0].hospname
  moment.locale('th');
  let sdate = moment(startdate).format('D MMMM ') + (moment(startdate).get('year') + 543);
  let edate = moment(enddate).format('D MMMM ') + (moment(enddate).get('year') + 543);
  let nDate = moment(new Date()).format('DD MMMM YYYY');
  let dates = moment(startdate).format('MMMM');
  let daten = moment(enddate).format('MMMM');
  let sum: any = 0;

  results.forEach(value => {
    sum += value.total_price
    value.order_date = moment(value.order_date).format('DD/MM/YYYY')
    value.unit_price = model.comma(value.unit_price)
    value.conversion = model.commaQty(value.conversion)
    value.qty = model.commaQty(value.qty)
    value.total_price = model.comma(value.total_price)
  });
  sum = model.comma(sum)

  res.render('pPurchasing', { results: results, hospname: hospname, daten: daten, dates: dates, sum: sum, nDate: nDate, sdate: sdate, edate: edate })
}));

router.get('/report/purchasing/:startdate/:enddate/:bgtypeId/:status', wrap(async (req, res, next) => {
  let startdate = req.params.startdate;
  let enddate = req.params.enddate;
  let bgtypeId = req.params.bgtypeId;
  let status = req.params.status;
  let db = req.db;
  let results = await model.Purchasing(db, startdate, enddate, bgtypeId, status);

  let hospname = await model.hospital(db);
  results = results[0]
  hospname = hospname[0].hospname
  moment.locale('th');
  let sdate = moment(startdate).format('D MMMM ') + (moment(startdate).get('year') + 543);
  let edate = moment(enddate).format('D MMMM ') + (moment(enddate).get('year') + 543);
  let nDate = moment(new Date()).format('DD MMMM YYYY');
  let dates = moment(startdate).format('MMMM');
  let daten = moment(enddate).format('MMMM');
  let sum: any = 0;

  results.forEach(value => {
    sum += value.total_price
    value.order_date = moment(value.order_date).format('DD/MM/YYYY')
    value.unit_price = model.comma(value.unit_price)
    value.conversion = model.commaQty(value.conversion)
    value.qty = model.commaQty(value.qty)
    value.total_price = model.comma(value.total_price)
  });
  sum = model.comma(sum)

  res.render('pPurchasing', { results: results, hospname: hospname, daten: daten, dates: dates, sum: sum, nDate: nDate, sdate: sdate, edate: edate })
}));

router.get('/report/totalcost/purchase/:month', wrap(async (req, res, next) => {
  let db = req.db
  let month = req.params.month
  if (month.length == 1) month = '0' + month
  // console.log(month)
  let year = moment(new Date()).get('year') + 543
  let years = moment(new Date()).get('year')
  let smonth = years + '-' + month + '-01'
  let emonth = years + '-' + month + '-31'

  let type1 = await model.sumType1(db, smonth, emonth)
  let type2 = await model.sumType2(db, smonth, emonth)
  type1 = type1[0]
  type2 = type2[0]
  // console.log(type2)
  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  moment.locale('th');
  let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543);
  let thmonth = moment(month).format('MMMM')
  let sum: any = 0
  type1.forEach(v => {
    sum += v.total_price
    if (v.total_price == null) v.total_price = 0
    v.total_price = model.comma(v.total_price)
  });
  type2.forEach(v => {
    sum += v.total_price
    if (v.total_price == null) v.total_price = 0
    v.total_price = model.comma(v.total_price)
  });

  sum = model.comma(sum)
  res.render('totalcostpurchase', {
    type1: type1,
    type2: type2,
    hospname: hospitalName,
    nDate: nDate,
    thmonth: thmonth,
    year: year,
    sum: sum
  })
}));

router.get('/test', wrap(async (req, res, next) => {
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
  let hospitalName = hosdetail[0].hospname;
  let orderDate = moment(purchasing.order_date).format('D MMMM ') + (moment(purchasing.order_date).get('year') + 543);

  let purchasingOfficer = await model.getPurchasingOfficer(db);
  let inventoryBossName = _.find(purchasingOfficer, { 'type_id': 2 });
  let directorName = _.find(purchasingOfficer, { 'type_id': 1 });
  res.render('test', {
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


router.get('/report/purchasing/1/:purchaOrderId/:type', wrap(async (req, res, next) => {
  let db = req.db;
  let type = req.params.type;
  let purchaOrderId = req.params.purchaOrderId;

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let purchasing = await model.purchasing(db, purchaOrderId);

  purchasing = purchasing[0];
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0];
  count = count[0].count;
  let pricetext = model.bahtText(purchasing[0].total_price);
  let committee = await model.getCommitteeVerify(db, purchasing.verify_committee_id);

  committee = committee[0];
  let committee1 = committee ? committee[0].title_name + committee[0].fname + ' ' + committee[0].lname + ' ' + committee[0].position2 + ' เป็น' + committee[0].position_name : '';
  let committee2 = committee ? committee[1].title_name + committee[1].fname + ' ' + committee[1].lname + ' ' + committee[1].position2 + ' เป็น' + committee[1].position_name : '';
  let committee3 = committee ? committee[2].title_name + committee[2].fname + ' ' + committee[2].lname + ' ' + committee[2].position2 + ' เป็น' + committee[2].position_name : '';

  moment.locale('th');
  let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543);

  let committeecheck = await model.purchasingCommitteeCheck(db, purchaOrderId);
  committeecheck = committeecheck[0];
  let committeecheck1 = committeecheck ? committeecheck[0].title_name + committeecheck[0].fname + ' ' + committeecheck[0].lname : '';
  let committeecheckpos1 = committeecheck ? committeecheck[0].position2 : '';
  let committeecheck2 = committeecheck ? committeecheck[1].title_name + committeecheck[1].fname + ' ' + committeecheck[1].lname : '';
  let committeecheckpos2 = committeecheck ? committeecheck[1].position2 : '';
  let committeecheck3 = committeecheck ? committeecheck[2].title_name + committeecheck[2].fname + ' ' + committeecheck[2].lname : '';
  let committeecheckpos3 = committeecheck ? committeecheck[2].position2 : '';

  purchasing.forEach(value => {
    value.total_price = model.comma(value.total_price);
    // value.expired_date = moment(value.expired_date).format('DD/MM/') + (moment(value.expired_date).get('year') + 543);
  })

  res.render('purchasing', {
    hello: 'hello', hospitalName: hospitalName, type: type,
    purchasing: purchasing, count: count, pricetext: pricetext, nDate: nDate
    , committee1: committee1, committee2: committee2, committee3: committee3
    , committeecheck1: committeecheck1, committeecheck2: committeecheck2, committeecheck3: committeecheck3
    , committeecheckpos1: committeecheckpos1, committeecheckpos2: committeecheckpos2, committeecheckpos3: committeecheckpos3
  });
}));

router.get('/report/purchasing/2', wrap(async (req, res, next) => {
  let db = req.db;
  let purchaOrderId = req.query.purchaOrderId;
  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let purchasing2 = await model.purchasing2Chief(db, purchaOrderId);
  let committee = await model.purchasingCommittee(db, purchaOrderId);
  committee = committee[0];
  let committee1 = committee[0].title_name + committee[0].fname + ' ' + committee[0].lname;
  let committee1p = committee[0].position_name;
  let committee2 = committee[1].title_name + committee[1].fname + ' ' + committee[1].lname;
  let committee2p = committee[1].position_name;
  let committee3 = committee[2].title_name + committee[2].fname + ' ' + committee[2].lname;
  let committee3p = committee[2].position_name;
  res.render('purchasing2', {
    hello: 'hello', hospitalName: hospitalName, purchasing2: purchasing2[0]
    , committee1: committee1, committee2: committee2, committee3: committee3
    , committee1p: committee1p, committee2p: committee2p, committee3p: committee3p
  });
}));

router.get('/report/purchasing/3', wrap(async (req, res, next) => {
  let db = req.db;
  let type = req.query.type;
  let bgtype = req.query.bgtype;
  let bgtypesub = req.query.bgtypesub;
  let purchaOrderId = req.query.purchaOrderId;

  let purchasingOfficer = await model.getPurchasingOfficer(db);
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let poraor = hosdetail[0].managerName
  let purchasing = await model.purchasing3(db, purchaOrderId);
  purchasing = purchasing[0];
  let committeesVerify = await model.getCommitteeVerify(db, purchasing[0].verify_committee_id);
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0][0].count || 0;
  let at = await model.at(db)//book_prefix
  at = at[0]
  moment.locale('th');
  let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 544

  let budget = await model.budgetType(db, purchasing[0].budget_detail_id)
  budget = budget[0]
  let totalprice = 0

  let sum = model.comma(budget[0].amount - budget[0].order_amt)
  budget.forEach(value => {
    value.amount = model.comma(value.amount)
    value.order_amt = model.comma(value.order_amt)
  });

  purchasing.forEach(value => {
    totalprice += value.total_price
    if (value.qty == null) value.qty = 0;
    value.qty = model.commaQty(value.qty);
    value.qtyPoi = model.commaQty(value.qtyPoi);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.total = model.commaQty(value.total)
  })
  let ttotalprice = model.comma(totalprice)
  let bahtText = model.bahtText(totalprice)
  res.render('purchasing3', {
    type: type,
    purchasing: purchasing,
    sum: sum,
    total: ttotalprice,
    hospitalName: hospitalName,
    at_name: at[0].value,
    nDate: nDate,
    committeesVerify: committeesVerify,
    bahtText: bahtText,
    budget: budget,
    poraor: poraor,
    purchasingChief: purchasingChief[0],
  });
}));

router.get('/report/purchasing/4', wrap(async (req, res, next) => {
  let db = req.db;
  let purchaOrderId = req.query.purchaOrderId

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let province = hosdetail[0].province;

  moment.locale('th');
  let today = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
  let purchasing4 = await model.purchasing4(db, purchaOrderId);
  let total_price = model.comma(purchasing4[0].total_price);
  let total_priceT = model.bahtText(purchasing4[0].total_price);
  let date = moment(purchasing4[0].order_date).format('D MMMM ') + (moment(purchasing4[0].order_date).get('year') + 543)
  let getChief = await model.getChief(db, '1');
  res.render('purchasing4', {
    hello: 'hello',
    hospitalName: hospitalName,
    today: today,
    purchasing4: purchasing4,
    total_price: total_price,
    total_priceT: total_priceT,
    date: date,
    getChief: getChief[0],
    province: province
  });
}));

router.get('/report/purchasing/5', wrap(async (req, res, next) => {
  let db = req.db;
  let purchaOrderId = req.query.purchaOrderId

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let province = hosdetail[0].province;

  moment.locale('th');
  let today = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
  let purchasing5 = await model.purchasing5(db, purchaOrderId);
  let total_price = model.comma(purchasing5[0].total_price);
  let total_priceT = model.bahtText(purchasing5[0].total_price);
  let date = moment(purchasing5[0].order_date).format('D MMMM ') + (moment(purchasing5[0].order_date).get('year') + 543)
  let getChief = await model.getChief(db, '1');
  let committee = await model.purchasingCommittee(db, purchaOrderId);
  committee = committee[0];
  res.render('purchasing5', {
    hello: 'hello',
    hospitalName: hospitalName,
    today: today,
    purchasing5: purchasing5,
    total_price: total_price,
    total_priceT: total_priceT,
    date: date,
    getChief: getChief[0],
    province: province, committee: committee
  });
}));

router.get('/report/purchasing/6', wrap(async (req, res, next) => {
  let db = req.db;
  let purchaOrderId = req.query.purchaOrderId

  let getChief = await model.getChief(db, '4')
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)
  let buyer_fullname = purchasingChief[0].buyer_fullname
  let chief_fullname = purchasingChief[0].chief_fullname
  let buyer_position = purchasingChief[0].buyer_position
  let chief_position = purchasingChief[0].chief_position
  let nameChief = getChief[0].title + " " + getChief[0].fname + "  " + getChief[0].lname
  let hosdetail = await model.hospital(db);
  let results = await model.purchasing3(db, purchaOrderId);
  let committee = await model.purchasingCommittee(db, purchaOrderId);
  let at = await model.at(db)
  // if(results[0]===undefined||committee[0]===undefined) res.render('error404')
  at = at[0]
  results = results[0]
  let hospitalName = hosdetail[0].hospname;
  let province = hosdetail[0].province
  let name = results[0].name
  let at_name = at[0].value;
  moment.locale('th');
  let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 543
  let budgetYear = await model.budgetYear(db, year)
  let amount_budget = budgetYear[0].amount
  let labeler_name = results[0].labeler_name
  committee = committee[0];
  let committee1 = committee[0].title_name + committee[0].fname + ' ' + committee[0].lname + ' ' + committee[0].position2 + ' เป็น' + committee[0].position_name;
  let committee2 = committee[1].title_name + committee[1].fname + ' ' + committee[1].lname + ' ' + committee[1].position2 + ' เป็น' + committee[1].position_name;
  let committee3 = committee[2].title_name + committee[2].fname + ' ' + committee[2].lname + ' ' + committee[2].position2 + ' เป็น' + committee[2].position_name;

  let totalprice = 0

  results.forEach(value => {
    totalprice += value.total_price
    value.qty = model.commaQty(value.qty);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.p_cost = model.comma(value.p_cost);
    value.total = model.commaQty(value.total)
  })

  let bahtText = model.bahtText(totalprice)
  let t_totalprice = model.comma(totalprice)
  amount_budget = model.comma(amount_budget)

  res.render('purchasing6', {
    hello: 'hello',
    year: year,
    hospitalName: hospitalName,
    at_name: at_name,
    nDate: nDate,
    results: results,
    committee1: committee1,
    committee2: committee2,
    committee3: committee3,
    totalprice: t_totalprice,
    bahtText: bahtText,
    amount_budget: amount_budget,
    nameChief: nameChief,
    buyer_fullname: buyer_fullname,
    buyer_position: buyer_position,
    chief_fullname: chief_fullname,
    chief_position: chief_position,
    province: province,
    labeler_name: labeler_name,
    name: name
  });
}));

router.get('/report/purchasing/7', wrap(async (req, res, next) => {
  let db = req.db;
  let purchaOrderId = req.query.purchaOrderId

  let getChief = await model.getChief(db, '4')
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)
  let buyer_fullname = purchasingChief[0].buyer_fullname
  let chief_fullname = purchasingChief[0].chief_fullname
  let buyer_position = purchasingChief[0].buyer_position
  let chief_position = purchasingChief[0].chief_position
  let nameChief = getChief[0].title + " " + getChief[0].fname + "  " + getChief[0].lname
  let hosdetail = await model.hospital(db);
  let results = await model.purchasing3(db, purchaOrderId);
  let committee = await model.purchasingCommittee(db, purchaOrderId);
  let at = await model.at(db)
  // if(results[0]===undefined||committee[0]===undefined) res.render('error404')
  at = at[0]
  results = results[0]
  let hospitalName = hosdetail[0].hospname
  let address = hosdetail[0].address
  let province = hosdetail[0].province
  let name = results[0].name
  let at_name = at[0].value;
  moment.locale('th');
  let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 543
  let budgetYear = await model.budgetYear(db, year)
  let amount_budget = budgetYear[0].amount
  let labeler_name = results[0].labeler_name
  let labeler_address = results[0].address
  let labeler_phone = results[0].phone
  let nin = results[0].nin
  let cid = results[0].contract_id

  let totalprice = 0

  results.forEach(value => {
    totalprice += value.total_price
    value.qty = model.commaQty(value.qty);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.p_cost = model.comma(value.p_cost);
    value.total = model.commaQty(value.total)
  })

  let bahtText = model.bahtText(totalprice)
  let t_totalprice = model.comma(totalprice)
  amount_budget = model.comma(amount_budget)

  res.render('purchasing7', {
    hello: 'hello',
    year: year,
    hospitalName: hospitalName,
    at_name: at_name,
    nDate: nDate,
    results: results,
    nin: nin,
    labeler_address: labeler_address,
    labeler_phone: labeler_phone,
    totalprice: t_totalprice,
    bahtText: bahtText,
    amount_budget: amount_budget,
    nameChief: nameChief,
    buyer_fullname: buyer_fullname,
    buyer_position: buyer_position,
    chief_fullname: chief_fullname,
    chief_position: chief_position,
    province: province,
    labeler_name: labeler_name,
    name: name,
    address: address,
    purchaOrderId: purchaOrderId,
    cid: cid
  })
}));

router.get('/report/purchasing/8', wrap(async (req, res, next) => {
  let db = req.db;
  let purchaOrderId = req.query.purchaOrderId

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let province = hosdetail[0].province;

  moment.locale('th');
  let today = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
  let purchasing8 = await model.purchasing8(db, purchaOrderId);
  let total_price = model.comma(purchasing8[0].total_price);
  let total_priceT = model.bahtText(purchasing8[0].total_price);
  let date = moment(purchasing8[0].order_date).format('D MMMM ') + (moment(purchasing8[0].order_date).get('year') + 543)
  let getChief = await model.getChief(db, '1');
  let committee = await model.purchasingCommittee(db, purchaOrderId);
  committee = committee[0];
  res.render('purchasing8', {
    hello: 'hello',
    hospitalName: hospitalName,
    today: today,
    purchasing8: purchasing8,
    total_price: total_price,
    total_priceT: total_priceT,
    date: date,
    getChief: getChief[0],
    province: province,
    committee: committee
  });
}));

router.get('/report/purchasing/9/:startdate/:enddate', wrap(async (req, res, next) => {
  let db = req.db
  let startdate = req.params.startdate
  let enddate = req.params.enddate
  // console.log(startdate+" : "+enddate);

  moment.locale('th');
  let today = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
  let results = await model.purchasing9(db, startdate, enddate);
  results = results[0]
  // console.log(results);
  results.forEach(value => {
    value.unit_price = model.comma(value.unit_price)
    value.qty = model.commaQty(value.qty)
    value.qty1 = model.commaQty(value.qty1)
    value.total_price = model.comma(value.total_price)
  })
  startdate = moment(startdate).format('D MMMM ') + (moment(startdate).get('year') + 543)
  enddate = moment(enddate).format('D MMMM ') + (moment(enddate).get('year') + 543)
  res.render('purchasing9', {
    results: results,
    startdate: startdate,
    enddate: enddate
  });
}));

router.get('/report/purchasing/10/', wrap(async (req, res, next) => {
  let db = req.db;
  let type = req.query.type;
  let purchaOrderId = req.query.purchaOrderId;
  let chief = "ปฎิบัติราชการแทนผู้ว่าราชการจังหวัด";

  let purchasingOfficer = await model.getPurchasingOfficer(db);
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId);

  let cposition = await model.getPosition(db, purchasingChief[0].chief_id);
  let bposition = await model.getPosition(db, purchasingChief[0].buyer_id);
  let pcb = await model.pcBudget(db, purchaOrderId);

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let poraor = hosdetail[0].managerName
  let purchasing = await model.purchasing10(db, purchaOrderId);
  purchasing = purchasing[0];
  let committeesVerify = await model.purchasingCommittee2(db, purchaOrderId);
  committeesVerify = committeesVerify[0];
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0][0].count || 0;
  let at = await model.at(db)//book_prefix
  at = at[0]
  moment.locale('th');
  let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 1
  let budget = await model.budgetType(db, purchasing[0].budget_detail_id)
  budget = budget[0]
  let totalprice = 0

  let budgetsave = 0;
  budget.forEach(value => {
    budgetsave += value.amount;
    value.amount = model.comma(value.amount);
    value.order_amt = model.comma(value.order_amt);
  });

  purchasing.forEach(value => {
    totalprice += value.total_price;
    if (value.qty == null) value.qty = 0;
    value.qty = model.commaQty(value.qty);
    value.qtyPoi = model.commaQty(value.qtyPoi);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.total = model.commaQty(value.total)
  })

  pcb.forEach(value => {
    value.incoming_balance = model.comma(value.incoming_balance)
    value.amount = model.comma(value.amount)
    value.balance = model.comma(value.balance)
  })

  let ttotalprice = model.comma(totalprice)
  let bahtText = model.bahtText(totalprice)
  let _month: any = moment(new Date()).format('MM');
  let _year: any = moment(new Date()).get('year');
  if (_month >= 10) {
    _year = (_year + 1);
  }

  let sdate = (_year - 1) + '-10-01';
  let ldate = (_year) + '-9-30';
  let sumTotal = await model.getSumTotal(db, purchasing[0].budget_detail_id)
  sumTotal = sumTotal[0];
  let sum = model.comma(budgetsave - sumTotal[0].sum)
  sumTotal = model.comma(sumTotal[0].sum - totalprice)

  let getAmountTransaction = await model.allAmountTransaction(db, purchasing[0].budget_detail_id, _year, purchasing[0].purchase_order_id)
  getAmountTransaction = getAmountTransaction[0];
  let allAmount: any = getAmountTransaction[0].amount;
  allAmount = model.comma(allAmount);

  if (pcb[0] == null
    || type == null
    || purchasing == null
    || sum == null
    || hospitalName == null
    || at[0].value == null
    || nDate == null
    || committeesVerify == null
    || bahtText == null
    || budget == null
    || sumTotal == null
  )
    res.render('error404')
  res.render('purchasing10', {
    allAmount: allAmount,
    pcb: pcb[0],
    chief: chief,
    type: type,
    purchasing: purchasing,
    sum: sum,
    total: ttotalprice,
    hospitalName: hospitalName,
    at_name: at[0].value,
    nDate: nDate,
    committeesVerify: committeesVerify,
    bahtText: bahtText,
    budget: budget,
    poraor: poraor,
    purchasingChief: purchasingChief[0],
    sumTotal: sumTotal,
    cposition: cposition[0],
    bposition: bposition[0]
  });
}));

router.get('/report/purchasing/11', wrap(async (req, res, next) => {
  let db = req.db;
  let type = req.query.type;
  let bgtypesub = req.query.bgtypesub;
  let bgtype = req.query.bgtype;
  let purchaOrderId = req.query.purchaOrderId;
  let chief = "ปฎิบัติราชการแทนผู้ว่าราชการจังหวัด";

  let purchasingOfficer = await model.getPurchasingOfficer(db);
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)
  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let poraor = hosdetail[0].managerName;
  let purchasing = await model.purchasing10(db, purchaOrderId);
  purchasing = purchasing[0];
  let cposition = await model.getPosition(db, purchasingChief[0].chief_id);
  let bposition = await model.getPosition(db, purchasingChief[0].buyer_id);
  let committeesVerify = await model.purchasingCommittee2(db, purchaOrderId);
  committeesVerify = committeesVerify[0];
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0][0].count || 0;
  let at = await model.at(db)//book_prefix
  at = at[0]
  moment.locale('th');
  let nDate = moment(new Date()).format('MMMM ') + (moment(new Date()).get('year') + 543)
  let dDate = moment(new Date()).format(' MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 544

  let budget = await model.budgetType(db, purchasing[0].budget_detail_id)
  budget = budget[0]
  let totalprice = 0
  let poNumber = purchasing[0].purchase_order_book_number ? purchasing[0].purchase_order_book_number : '';

  let sum = model.comma(budget[0].amount - budget[0].order_amt)
  budget.forEach(value => {
    value.amount = model.comma(value.amount)
    value.order_amt = model.comma(value.order_amt)
  });
  let countp = 0;
  purchasing.forEach(value => {
    countp++;
    totalprice += value.total_price
    if (value.qty == null) value.qty = 0;
    value.qty = model.commaQty(value.qty);
    value.qtyPoi = model.commaQty(value.qtyPoi);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.total = model.commaQty(value.total)
  })
  let ttotalprice = model.comma(totalprice)
  let bahtText = model.bahtText(totalprice)

  let pcb = await model.pcBudget(db, purchaOrderId);
  pcb.forEach(value => {
    value.incoming_balance = model.comma(value.incoming_balance)
    value.amount = model.comma(value.amount)
    value.balance = model.comma(value.balance)
  })

  let getAmountTransaction = await model.allAmountTransaction(db, purchasing[0].budget_detail_id, +year - 544, purchasing[0].purchase_order_id);
  getAmountTransaction = getAmountTransaction[0];
  let allAmount: any = getAmountTransaction[0].amount;
  allAmount = model.comma(allAmount);

  res.render('purchasing11', {
    allAmount: allAmount,
    pcb: pcb[0],
    poNumber: poNumber,
    cposition: cposition[0],
    bposition: bposition[0],
    type: type,
    purchasing: purchasing,
    sum: sum,
    countp: countp,
    total: ttotalprice,
    hospitalName: hospitalName,
    at_name: at[0].value,
    chief: chief,
    nDate: nDate,
    dDate: dDate,
    committeesVerify: committeesVerify,
    bahtText: bahtText,
    budget: budget,
    poraor: poraor,
    purchasingChief: purchasingChief[0],
  });
}));

router.get('/report/purchasing/12', wrap(async (req, res, next) => {
  let db = req.db;
  let type = req.query.type;
  let bgtype = req.query.bgtype;
  let bgtypesub = req.query.bgtypesub;
  let purchaOrderId = req.query.purchaOrderId;

  let purchasingOfficer = await model.getPurchasingOfficer(db);
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let poraor = hosdetail[0].managerName
  let purchasing = await model.purchasing10(db, purchaOrderId);
  purchasing = purchasing[0];
  let delivery = purchasing[0].delivery
  let committeesVerify = await model.getCommitteeVerify(db, purchasing[0].verify_committee_id);
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0][0].count || 0;
  let at = await model.at(db)//book_prefix
  at = at[0]
  moment.locale('th');
  let nDate = moment(new Date()).format('DD MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 544

  let budget = await model.budgetType(db, purchasing[0].budget_detail_id)
  budget = budget[0]
  let totalprice = 0
  let textamount = model.bahtText(budget[0].amount)

  let sum = model.comma(budget[0].amount - budget[0].order_amt)
  budget.forEach(value => {
    value.amount = model.comma(value.amount)
    value.order_amt = model.comma(value.order_amt)
  });
  let bidname = purchasing[0].name

  let countp = 0;
  purchasing.forEach(value => {
    countp++;
    totalprice += value.total_price
    if (value.qty == null) value.qty = 0;
    value.qty = model.commaQty(value.qty);
    value.qtyPoi = model.commaQty(value.qtyPoi);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.total = model.commaQty(value.total)
  })
  let ttotalprice = model.comma(totalprice)
  let bahtText = model.bahtText(totalprice)
  let province = hosdetail[0].province;

  res.render('purchasing12', {
    delivery: delivery,
    textamount: textamount,
    type: type,
    purchasing: purchasing,
    sum: sum,
    province: province,
    countp: countp,
    total: ttotalprice,
    hospitalName: hospitalName,
    at_name: at[0].value,
    nDate: nDate,
    committeesVerify: committeesVerify,
    bidname: bidname,
    // committeesCheck:committeesCheck,
    bahtText: bahtText,
    budget: budget,
    poraor: poraor,
    purchasingChief: purchasingChief[0],
  });
}));

router.get('/report/purchasing/13', wrap(async (req, res, next) => {
  let db = req.db;
  let type = req.query.type;
  let bgtype = req.query.bgtype;
  let bgtypesub = req.query.bgtypesub;
  let purchaOrderId = req.query.purchaOrderId;

  let purchasingOfficer = await model.getPurchasingOfficer(db);
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let poraor = hosdetail[0].managerName
  let purchasing = await model.purchasing10(db, purchaOrderId);
  purchasing = purchasing[0];
  let committeesVerify = await model.getCommitteeVerify(db, purchasing[0].verify_committee_id);
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0][0].count || 0;
  let at = await model.at(db)//book_prefix
  at = at[0]
  moment.locale('th');
  let nDate = moment(new Date()).format('DD MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 544

  let budget = await model.budgetType(db, purchasing[0].budget_detail_id)
  budget = budget[0]
  let totalprice = 0
  let textamount = model.bahtText(budget[0].amount)

  let sum = model.comma(budget[0].amount - budget[0].order_amt)
  budget.forEach(value => {
    value.amount = model.comma(value.amount)
    value.order_amt = model.comma(value.order_amt)
  });
  let bidname = purchasing[0].name

  let countp = 0;
  purchasing.forEach(value => {
    countp++;
    totalprice += value.total_price
    if (value.qty == null) value.qty = 0;
    value.qty = model.commaQty(value.qty);
    value.qtyPoi = model.commaQty(value.qtyPoi);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.total = model.commaQty(value.total)
  })
  let ttotalprice = model.comma(totalprice)
  let bahtText = model.bahtText(totalprice)
  let province = hosdetail[0].province;

  res.render('purchasing13', {
    textamount: textamount,
    type: type,
    purchasing: purchasing,
    sum: sum,
    province: province,
    countp: countp,
    total: ttotalprice,
    hospitalName: hospitalName,
    at_name: at[0].value,
    nDate: nDate,
    committeesVerify: committeesVerify,
    bidname: bidname,
    bahtText: bahtText,
    budget: budget,
    poraor: poraor,
    purchasingChief: purchasingChief[0],
  });
}));

router.get('/report/purchasing/14', wrap(async (req, res, next) => {
  let db = req.db;
  let type = req.query.type;
  let bgtype = req.query.bgtype;
  let bgtypesub = req.query.bgtypesub;
  let purchaOrderId = req.query.purchaOrderId;

  let purchasingOfficer = await model.getPurchasingOfficer(db);
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let poraor = hosdetail[0].managerName
  let purchasing = await model.purchasing10(db, purchaOrderId);
  purchasing = purchasing[0];
  let committeesVerify = await model.getCommitteeVerify(db, purchasing[0].verify_committee_id);
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0][0].count || 0;
  let at = await model.at(db)//book_prefix
  at = at[0]
  moment.locale('th');
  let nDate = moment(new Date()).format('DD MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 544

  let budget = await model.budgetType(db, purchasing[0].budget_detail_id)
  budget = budget[0]
  let totalprice = 0
  let textamount = model.bahtText(budget[0].amount)

  let sum = model.comma(budget[0].amount - budget[0].order_amt)
  budget.forEach(value => {
    value.amount = model.comma(value.amount)
    value.order_amt = model.comma(value.order_amt)
  });
  let bidname = purchasing[0].name

  let countp = 0;
  purchasing.forEach(value => {
    countp++;
    totalprice += value.total_price
    if (value.qty == null) value.qty = 0;
    value.qty = model.commaQty(value.qty);
    value.qtyPoi = model.commaQty(value.qtyPoi);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.total = model.commaQty(value.total)
  })
  let ttotalprice = model.comma(totalprice)
  let bahtText = model.bahtText(totalprice)
  let province = hosdetail[0].province;

  res.render('purchasing14', {
    textamount: textamount,
    type: type,
    purchasing: purchasing,
    sum: sum,
    province: province,
    countp: countp,
    total: ttotalprice,
    hospitalName: hospitalName,
    at_name: at[0].value,
    nDate: nDate,
    committeesVerify: committeesVerify,
    bidname: bidname,
    // committeesCheck:committeesCheck,
    bahtText: bahtText,
    budget: budget,
    poraor: poraor,
    purchasingChief: purchasingChief[0],
  });
}));

router.get('/report/purchasing/15', wrap(async (req, res, next) => {
  let db = req.db;
  let type = req.query.type;
  let bgtype = req.query.bgtype;
  let bgtypesub = req.query.bgtypesub;
  let purchaOrderId = req.query.purchaOrderId;

  let purchasingOfficer = await model.getPurchasingOfficer(db);
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let poraor = hosdetail[0].managerName
  let purchasing = await model.purchasing10(db, purchaOrderId);
  purchasing = purchasing[0];
  let committeesVerify = await model.getCommitteeVerify(db, purchasing[0].verify_committee_id);
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0][0].count || 0;
  let at = await model.at(db)//book_prefix
  at = at[0]
  moment.locale('th');
  let nDate = moment(new Date()).format('DD MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 544

  let budget = await model.budgetType(db, purchasing[0].budget_detail_id)
  budget = budget[0]
  let totalprice = 0
  let textamount = model.bahtText(budget[0].amount)

  let sum = model.comma(budget[0].amount - budget[0].order_amt)
  budget.forEach(value => {
    value.amount = model.comma(value.amount)
    value.order_amt = model.comma(value.order_amt)
  });
  let bidname = purchasing[0].name

  let countp = 0;
  purchasing.forEach(value => {
    countp++;
    totalprice += value.total_price
    if (value.qty == null) value.qty = 0;
    value.qty = model.commaQty(value.qty);
    value.qtyPoi = model.commaQty(value.qtyPoi);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.total = model.commaQty(value.total)
  })
  let ttotalprice = model.comma(totalprice)
  let bahtText = model.bahtText(totalprice)
  let province = hosdetail[0].province;
  let lname = purchasing[0].labeler_name

  res.render('purchasing15', {
    lname: lname,
    textamount: textamount,
    type: type,
    purchasing: purchasing,
    sum: sum,
    province: province,
    countp: countp,
    total: ttotalprice,
    hospitalName: hospitalName,
    at_name: at[0].value,
    nDate: nDate,
    committeesVerify: committeesVerify,
    bidname: bidname,
    // committeesCheck:committeesCheck,
    bahtText: bahtText,
    budget: budget,
    poraor: poraor,
    purchasingChief: purchasingChief[0],
  });
}));

router.get('/report/purchasing/16', wrap(async (req, res, next) => {
  let db = req.db;
  let type = req.query.type;
  let bgtype = req.query.bgtype;
  let purchaOrderId = req.query.purchaOrderId;

  let purchasingOfficer = await model.getPurchasingOfficer(db);
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)

  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let poraor = hosdetail[0].managerName
  let purchasing = await model.purchasing10(db, purchaOrderId);
  purchasing = purchasing[0];
  let committeesVerify = await model.getCommitteeVerify(db, purchasing[0].verify_committee_id);
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0][0].count || 0;
  let at = await model.at(db)//book_prefix
  at = at[0]
  moment.locale('th');
  let nDate = moment(new Date()).format('DD MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 544
  let bgtypesub = req.query.bgtypesub;
  let budget = await model.budgetType(db, purchasing[0].budget_detail_id)
  budget = budget[0]
  let totalprice = 0
  let textamount = model.bahtText(budget[0].amount)

  let sum = model.comma(budget[0].amount - budget[0].order_amt)
  budget.forEach(value => {
    value.amount = model.comma(value.amount)
    value.order_amt = model.comma(value.order_amt)
  });
  let bidname = purchasing[0].name

  let countp = 0;
  purchasing.forEach(value => {
    countp++;
    totalprice += value.total_price
    if (value.qty == null) value.qty = 0;
    value.qty = model.commaQty(value.qty);
    value.qtyPoi = model.commaQty(value.qtyPoi);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.total = model.commaQty(value.total)
  })
  let ttotalprice = model.comma(totalprice)
  let bahtText = model.bahtText(totalprice)
  let province = hosdetail[0].province;
  let lname = purchasing[0].labeler_name

  res.render('purchasing16', {
    lname: lname,
    textamount: textamount,
    type: type,
    purchasing: purchasing,
    sum: sum,
    province: province,
    countp: countp,
    total: ttotalprice,
    hospitalName: hospitalName,
    at_name: at[0].value,
    nDate: nDate,
    committeesVerify: committeesVerify,
    bidname: bidname,
    // committeesCheck:committeesCheck,
    bahtText: bahtText,
    budget: budget,
    poraor: poraor,
    purchasingChief: purchasingChief[0],
  });
}));

router.post('/report/purchasingorder', wrap(async (req, res, next) => {
  let purchasOrderId = req.body.orderId;
  // console.log('++++++++++++++++++++++++++++++++++++'+purchasOrderId);

  let num = purchasOrderId.length;
  let db = req.db;
  let hospname = await model.hospital(db)
  let hospAddress = hospname[0].address
  let hopsTel = hospname[0].telephone
  let hopsprovince = hospname[0].province
  hospname = hospname[0].hospname

  // console.log('++++++++++++++++++++++++++++++++' + num);
  let nDate = moment(new Date()).format('DD MMMM ') + (moment(new Date()).get('year') + 543)
  // let year = moment(new Date).get('year') + 544
  let array = [];
  let array1 = [];
  for (let i = 0; i < num; i++) {
    // console.log('++++' + purchasOrderId[i]);

    let results = await model.purchasingOrder(db, purchasOrderId[i])
    results = results[0];
    array.push(results);
    // console.log('++++++++++++++++++++' + array[i][0]);


    let getchief = await model.purchasing2Chief(db, purchasOrderId[i]);
    getchief = getchief[0].chief_fullname;
    array1.push(getchief);
    console.log(getchief);

  }
  res.render('porders', {
    array: array,
    num: num,
    hospname: hospname,
    getchief: array1,
    nDate: nDate,
    hospAddress: hospAddress,
    hopsTel: hopsTel,
    hopsprovince: hopsprovince
  });
}));

router.get('/report/getporder', wrap(async (req, res, next) => {
  let porder = req.query.porder
  let db = req.db;

  let hospname = await model.hospital(db)
  let hospAddress = hospname[0].address
  let hopsTel = hospname[0].telephone
  let hopsprovince = hospname[0].province
  hospname = hospname[0].hospname
  moment.locale('th');
  let nDate = moment(new Date()).format('DD MMMM ') + (moment(new Date()).get('year') + 543)
  let array = [];
  let array1 = [];
  let arraySum = [];
  let arraySumText = [];

  for (let i = 0; i < porder.length; i++) {
    let sum: any = 0;
    let sumtext: any = ""
    let results = await model.purchasingOrder(db, porder[i])
    results = results[0];
    array.push(results);
    results.forEach(value => {
      sum += value.total;
      value.total = model.comma(value.total)
    });
    sumtext = model.bahtText(sum)
    sum = model.comma(sum);
    arraySum.push(sum)
    arraySumText.push(sumtext)

    let getchief = await model.purchasing2Chief(db, porder[i]);
    getchief = getchief[0].chief_fullname;
    array1.push(getchief);
  }
  // console.log(arraySum);
  // console.log(arraySumText);

  res.render('porders', {
    arraySum: arraySum,
    arraySumText: arraySumText,
    array: array,
    num: porder.length,
    hospname: hospname,
    getchief: array1,
    nDate: nDate,
    hospAddress: hospAddress,
    hopsTel: hopsTel,
    hopsprovince: hopsprovince
  })
}));

router.get('/report/getporder/singburi', wrap(async (req, res, next) => {
  let _porder = req.query.porder;
  let db = req.db;

  let hospname = await model.hospital(db)
  let hospAddress = hospname[0].address
  let hopsTel = hospname[0].telephone
  let hopsprovince = hospname[0].province
  hospname = hospname[0].hospname
  moment.locale('th');
  let nDate = moment(new Date()).format('DD MMMM ') + (moment(new Date()).get('year') + 543)
  let array = [];
  let array1 = [];
  let arraySum = [];
  let arraySumText = [];
  let poraor = hospname[0].managerName
  let chief: any = []

  let porder = [];

  if (typeof _porder === 'string') {
    porder.push(_porder);
  } else {
    porder = _porder;
  }

  for (let i = 0; i < porder.length; i++) {
    let sum: any = 0;
    let sumtext: any = ""
    let results = await model.purchasingOrder(db, porder[i])
    results = results[0];
    array.push(results);
    results.forEach(value => {
      sum += value.total;
    });

    sumtext = model.bahtText(sum)
    sum = model.comma(sum);
    arraySum.push(sum)
    arraySumText.push(sumtext)

    let getchief = await model.purchasing2Chief(db, porder[i]);
    getchief = getchief[0].chief_fullname;
    // if (results[0].bid_name.substring(0, 11) == 'จัดซื้อร่วม' || results[0].bid_name.substring(0, 7) == 'สอบราคา') {
    //   getchief = poraor.title + poraor.fname + "  " + poraor.lname
    //   chief[i] = 1
    // }
    array1.push(getchief);
  }
  // console.log(arraySum);
  // console.log(arraySumText);

  res.render('purchase_order', {
    chief: chief,
    arraySum: arraySum,
    arraySumText: arraySumText,
    array: array,
    num: porder.length,
    hospname: hospname,
    getchief: array1,
    nDate: nDate,
    hospAddress: hospAddress,
    hopsTel: hopsTel,
    hopsprovince: hopsprovince
  })
}));

router.get('/report/po/egp', wrap(async (req, res, next) => {
  let db = req.db;
  let type = req.query.type;
  let purchaOrderId = req.query.purchaOrderId;
  ////ชื่อโรงพยาบาล//////////
  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let hostel = hosdetail[0].telephone;
  let hosaddress = hosdetail[0].address;
  ////ผอ///////////////////
  let poraor = hosdetail[0].managerName;
  // console.log('++++++++++++++++++++++++++++',hosdetail[0])
  /////หัวหน้า/เจ้าหนาที่/////////////////
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)
  ////query////////////////
  let purchasing = await model.purchasing10(db, purchaOrderId);
  purchasing = purchasing[0];
  ////////คณะกรรมการ////////////
  let committeesVerify = await model.purchasingCommittee2(db, purchaOrderId);
  committeesVerify = committeesVerify[0];
  ///////นับจำนวน//////////////////
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0][0].count || 0;
  ////////book_prefix///////////////
  let at = await model.at(db)
  at = at[0]
  /////วันที่ปัจจับุัน / ปีงบ/////////////////
  moment.locale('th');
  let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 544
  /////งบประมาณ///////////
  let budget = await model.budgetType(db, purchasing[0].budget_detail_id)
  budget = budget[0]
  ////////////////////////
  let totalprice = 0
  let textamount = model.bahtText(budget[0].amount)
  let sum = model.comma(budget[0].amount - budget[0].order_amt)
  budget.forEach(value => {
    value.amount = model.comma(value.amount)
    value.order_amt = model.comma(value.order_amt)
  });
  let bidname = purchasing[0].name
  purchasing.forEach(value => {
    totalprice += value.total_price
    if (value.qty == null) value.qty = 0;
    value.qty = model.commaQty(value.qty);
    value.qtyPoi = model.commaQty(value.qtyPoi);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.total = model.commaQty(value.total)
  })
  let ttotalprice = model.comma(totalprice)
  let bahtText = model.bahtText(totalprice)
  let province = hosdetail[0].province;

  res.render('egp', {
    textamount: textamount,
    type: type,
    purchasing: purchasing,
    sum: sum,
    hosaddress: hosaddress,
    province: province,
    hostel: hostel,
    countp: count,
    total: ttotalprice,
    hospitalName: hospitalName,
    at_name: at[0].value,
    nDate: nDate,
    committeesVerify: committeesVerify,
    bidname: bidname,
    bahtText: bahtText,
    budget: budget,
    poraor: poraor,
    purchasingChief: purchasingChief[0]
  });
}));

router.get('/report/po/egp/singburi', wrap(async (req, res, next) => {
  let db = req.db;
  let type = req.query.type;
  let purchaOrderId = req.query.purchaOrderId;
  let chief = "ปฎิบัติราชการแทนผู้ว่าราชการจังหวัด";

  ////ชื่อโรงพยาบาล//////////
  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let hostel = hosdetail[0].telephone;
  let hosaddress = hosdetail[0].address;
  ////ผอ///////////////////
  let poraor = hosdetail[0].managerName;
  let pcb = await model.pcBudget(db, purchaOrderId);
  // console.log('++++++++++++++++++++++++++++',hosdetail[0])
  /////หัวหน้า/เจ้าหนาที่/////////////////
  let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)
  ////query////////////////
  let purchasing = await model.purchasing10(db, purchaOrderId);
  purchasing = purchasing[0];
  ////////คณะกรรมการ////////////
  let committeesVerify = await model.purchasingCommittee2(db, purchaOrderId);
  committeesVerify = committeesVerify[0];
  ///////นับจำนวน//////////////////
  let count = await model.purchasingCountItem(db, purchaOrderId);
  count = count[0][0].count || 0;
  ////////book_prefix///////////////
  let at = await model.at(db)
  at = at[0]
  /////วันที่ปัจจับุัน / ปีงบ/////////////////
  moment.locale('th');
  let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
  let year = moment(new Date).get('year') + 544
  /////งบประมาณ///////////
  let budget = await model.budgetType(db, purchasing[0].budget_detail_id)
  budget = budget[0]
  ////////////////////////
  let totalprice = 0
  let textamount = model.bahtText(budget[0].amount)
  let sum = model.comma(budget[0].amount - budget[0].order_amt)
  budget.forEach(value => {
    value.amount = model.comma(value.amount)
    value.order_amt = model.comma(value.order_amt)
  });
  let bidname = await model.bidName(db, purchasing[0].purchase_method_id)
  purchasing.forEach(value => {
    totalprice += value.total_price
    if (value.qty == null) value.qty = 0;
    value.qty = model.commaQty(value.qty);
    value.qtyPoi = model.commaQty(value.qtyPoi);
    value.total_price = model.comma(value.total_price);
    value.unit_price = model.comma(value.unit_price);
    value.cost = model.comma(value.cost);
    value.standard_cost = model.comma(value.standard_cost);
    value.total = model.commaQty(value.total)
  })

  pcb.forEach(value => {
    value.incoming_balance = model.comma(value.incoming_balance)
    value.amount = model.comma(value.amount)
    value.balance = model.comma(value.balance)
  })

  let getAmountTransaction = await model.allAmountTransaction(db, purchasing[0].budget_detail_id, +year - 544, purchasing[0].purchase_order_id);
  getAmountTransaction = getAmountTransaction[0];
  let allAmount: any = getAmountTransaction[0].amount;
  allAmount = model.comma(allAmount);


  let ttotalprice = model.comma(totalprice)
  let bahtText = model.bahtText(totalprice)
  let province = hosdetail[0].province;

  let cposition = await model.getPosition(db, purchasingChief[0].chief_id);
  let bposition = await model.getPosition(db, purchasingChief[0].buyer_id);


  res.render('egpSingburi', {
    ttotalprice: ttotalprice,
    bahtText: bahtText,
    chief: chief,
    pcb: pcb[0],
    allAmount: allAmount,
    cposition: cposition[0],
    bposition: bposition[0],
    textamount: textamount,
    type: type,
    purchasing: purchasing,
    sum: sum,
    hosaddress: hosaddress,
    province: province,
    hostel: hostel,
    countp: count,
    total: ttotalprice,
    hospitalName: hospitalName,
    at_name: at[0].value,
    nDate: nDate,
    committeesVerify: committeesVerify,
    bidname: bidname[0].name,
    budget: budget,
    poraor: poraor,
    purchasingChief: purchasingChief[0]
  });
}));

// router.get('/report/allpo/egp/singburi', wrap(async (req, res, next) => {
//   let db = req.db;
//   let type = req.query.type;
//   let purchaOrderId = req.query.purchaOrderId;
//   let chief = "ปฎิบัติราชการแทนผู้ว่าราชการจังหวัด";

//   let hosdetail = await model.hospital(db);
//   let hospitalName = hosdetail[0].hospname;
//   let hostel = hosdetail[0].telephone;
//   let hosaddress = hosdetail[0].address;
//   let poraor = hosdetail[0].managerName;

//   let ttotalprice = []
//   let bahtText = []
//   let province = []
//   purchaOrderId.forEach(async (v, j: number = 0) => {
//     let purchasing = await model.purchasing10(db, purchaOrderId);
//     purchasing[i] = purchasing[0];

//     let committeesVerify = await model.purchasingCommittee2(db, purchaOrderId);
//     committeesVerify[i] = committeesVerify[0];

//     let count = await model.purchasingCountItem(db, purchaOrderId);
//     count = count[0][0].count || 0;

//     let pcb = await model.pcBudget(db, purchaOrderId);

//     let purchasingChief = await model.purchasing2Chief(db, purchaOrderId)

//     let budget = await model.budgetType(db, purchasing[i].budget_detail_id)
//     budget[i] = budget[0]

//     let textamount = model.bahtText(budget[i].amount)
//     let sum = model.comma(budget[i].amount - budget[i].order_amt)
//     budget[i].forEach(value => {
//       value.amount = model.comma(value.amount)
//       value.order_amt = model.comma(value.order_amt)
//     });

//     let bidname = []
//     bidname[i] = await model.bidName(db, purchasing[i].purchase_method_id)
//     purchasing[i].forEach(value => {
//       totalprice += value.total_price
//       if (value.qty == null) value.qty = 0;
//       value.qty = model.commaQty(value.qty);
//       value.qtyPoi = model.commaQty(value.qtyPoi);
//       value.total_price = model.comma(value.total_price);
//       value.unit_price = model.comma(value.unit_price);
//       value.total = model.commaQty(value.total)
//     })

//     pcb[i].forEach(value => {
//       value.incoming_balance = model.comma(value.incoming_balance)
//       value.amount = model.comma(value.amount)
//       value.balance = model.comma(value.balance)
//     })

//     let getAmountTransaction[i] = await model.allAmountTransaction(db, purchasing[i].budget_detail_id, +year- 544,purchasing[0].purchase_order_id);
//     let allAmount = []
//     allAmount[i] = getAmountTransaction[i].amount;
//     allAmount[i] = model.comma(allAmount);

//     let cposition = await model.getPosition(db, purchasingChief[i].chief_id);
//     let bposition = await model.getPosition(db, purchasingChief[i].buyer_id);

//     ttotalprice[i] = model.comma(totalprice)
//     bahtText[i] = model.bahtText(totalprice)
//     province[i] = hosdetail[0].province;
//   });

//   let at = await model.at(db)
//   at = at[0]
//   moment.locale('th');
//   let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
//   let year = moment(new Date).get('year') + 544
//   let totalprice = 0

//   res.render('egpSingburi', {
//     ttotalprice: ttotalprice,
//     bahtText: bahtText,
//     chief: chief,
//     pcb: pcb[0],
//     allAmount: allAmount,
//     cposition: cposition[0],
//     bposition: bposition[0],
//     textamount: textamount,
//     type: type,
//     purchasing: purchasing,
//     sum: sum,
//     hosaddress: hosaddress,
//     province: province,
//     hostel: hostel,
//     countp: count,
//     total: ttotalprice,
//     hospitalName: hospitalName,
//     at_name: at[0].value,
//     nDate: nDate,
//     committeesVerify: committeesVerify,
//     bidname: bidname[0].name,
//     budget: budget,
//     poraor: poraor,
//     purchasingChief: purchasingChief[0]
//   });
// }));

router.get('/report/getProductHistory/:generic_code', wrap(async (req, res, next) => {
  let db = req.db;
  let generic_code = req.params.generic_code;
  ////ชื่อโรงพยาบาล//////////
  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  let hostel = hosdetail[0].telephone;
  let hosaddress = hosdetail[0].address;

  let rs: any = await model.getProductHistory(db, generic_code);
  // console.log('++++++++++++++++++++++++' + JSON.stringify(rs) + '++++++++++++++++++++++++')
  // console.log(rs[0])

  res.render('purchaseHistory', {
    hospitalName: hospitalName
  });
}));

export default router;