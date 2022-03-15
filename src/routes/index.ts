'use strict';

import * as express from 'express';
import * as moment from 'moment';
import * as wrap from 'co-express';
import * as _ from 'lodash';
import { PurchasingOrderReportModel } from '../models/reports/purchasingOrder';
import { RequisitionOrderReportModel } from '../models/reports/requisitionOrder';


const model = new PurchasingOrderReportModel();
const modelPr = new RequisitionOrderReportModel();
const router = express.Router();

const path = require('path')
const fse = require('fs-extra');
const fs = require('fs');
const json2xls = require('json2xls');

let chief = "ปฎิบัติราชการแทนผู้ว่าราชการจังหวัด";
// moment.locale('th');
// const printDate = 'วันที่พิมพ์ ' + moment().format('D MMMM ') + (moment().get('year') + 543) + moment().format(', HH:mm:ss น.');


function printDate(SYS_PRINT_DATE) {
  moment.locale('th');
  let printDate
  if (SYS_PRINT_DATE === 'Y') {
    printDate = 'วันที่พิมพ์ ' + moment().format('D MMMM ') + (moment().get('year') + 543) + moment().format(', HH:mm:ss น.');
  } else {
    printDate = '';
  }
  return printDate;
}
async function getOfficer(db, officerId) {
  const staff = await model.getStaff(db, officerId);
  return staff[0] ? staff[0] : null;
}

async function getCommitee(db, committeeId) {
  let committee = await model.purchasingCommittee(db, committeeId);
  if (committee.length == 1) {
    committee[0].position = 'ผู้ตรวจรับพัสดุ';
  }
  return committee.length ? committee : null;
}

router.get('/', (req, res, next) => {
  res.send({ ok: true, message: 'Welcome to Purchasing API server' });
});

router.get('/version', (req, res, next) => {
  res.send({ ok: true, version: 'v1.0.0', build: '20170603' });
});

router.get('/report/requisitionorder/:orderId', wrap(async (req, res, next) => {
  let db = req.db;
  let orderId = req.params.orderId;

  let detail: any[] = await modelPr.requisitionItem(db, orderId);
  let detail1: any[] = await modelPr.name(db, orderId);
  let hospname = await model.hospital(db);
  hospname = hospname.hospname
  detail = detail[0]
  detail1 = detail1[0]
  if (detail === undefined) res.render('error404')
  if (detail1 === undefined) res.render('error404')
  let date = model.prettyDate(detail[0].order_date);
  let lname = (detail[0].labeler_name)
  let bgname = (detail[0].bgtype_name)
  let requisitionItem = detail;
  let name = detail1;

  res.render('requisition_order', { hospname: hospname, requisitionItem: requisitionItem, date: date, name: name, lname: lname, bgname: bgname });
}));

router.get('/report/agree', wrap(async (req, res, next) => {
  let db = req.db;
  let hospname = await model.hospital(db);

  hospname = hospname.hospname
  res.render('agree', { hospname: hospname })
}));

router.get('/report/purchase', wrap(async (req, res, next) => {
  res.render('purchase')
}));


// router.get('/report/list/purchaseSelec', wrap(async (req, res, next) => {
//   let generic_type_id = req.query.generic_type_id;
//   let warehouseId = req.decoded.warehouseId;

//   let db = req.db;

//   let results = await model.getOrderPoint(db, warehouseId, generic_type_id);
//   let hospname = await model.hospital(db);
//   results = results[0]
//   if (results[0] === undefined) res.render('error404')
//   hospname = hospname.hospname
//   let nDate = model.prettyDate(new Date())
//   let i = 0;
//   let fill = [];
//   results.forEach(value => {
//     fill[i] = ((value.max_qty - value.remain_qty) / value.qty).toFixed(0);
//     fill[i] < 0 ? fill[i] = 1 : fill[i];
//     value.remain_qty = (value.remain_qty / value.qty).toFixed(0);
//     if (value.qty === null) value.qty = 0
//     if (value.min_qty === null) value.min_qty = 0
//     i++;
//   });

//   moment.locale('th');
//   let sdate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543);

//   res.render('listpurchase', { fill: fill, nDate: nDate, hospname: hospname, results: results, printDate: printDate(req.decoded.SYS_PRINT_DATE) })
// }));

router.get('/report/list/all/purchase-trade-select', wrap(async (req, res, next) => {
  let generic_id = req.query.generic_id;
  let warehouseId = req.decoded.warehouseId;
  let db = req.db;

  generic_id = Array.isArray(generic_id) ? generic_id : [generic_id]
  Array.isArray(generic_id)

  let array: any = [];
  for (let i = 0; i < generic_id.length; i++) {
    let results = await model.getSelectOrderPointGeneric(db, warehouseId, generic_id[i], null);

    array.push(results[0][0]);
  }
  let hospname = await model.hospital(db);
  if (array[0] === undefined) res.render('error404')
  hospname = hospname.hospname
  let nDate = model.prettyDate(new Date())
  let i = 0;
  let fill = [];
  array.forEach(value => {
    fill[i] = ((value.max_qty - value.remain_qty) / value.qty).toFixed(0);
    fill[i] < 0 ? fill[i] = 1 : fill[i];
    value.remain_qty = (value.remain_qty / value.qty).toFixed(0);
    if (value.qty === null) value.qty = 0
    if (value.min_qty === null) value.min_qty = 0
    i++;
  });
  moment.locale('th');
  let sdate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543);
  console.log(array);

  // res.send(array);
  res.render('listpurchase', { fill: fill, nDate: nDate, hospname: hospname, results: array, printDate: printDate(req.decoded.SYS_PRINT_DATE) })
}));

router.get('/report/list/purchase-trade-select', wrap(async (req, res, next) => {
  let product_id = req.query.p;
  let unit_generic_id = req.query.u;
  let warehouseId = req.decoded.warehouseId;
  let db = req.db;
  product_id = Array.isArray(product_id) ? product_id : [product_id]
  Array.isArray(product_id)
  unit_generic_id = Array.isArray(unit_generic_id) ? unit_generic_id : [unit_generic_id]
  Array.isArray(unit_generic_id)

  let array: any = [];
  for (let i = 0; i < product_id.length; i++) {
    let results = await model.getSelectOrderPoint(db, warehouseId, product_id[i], unit_generic_id[i]);

    array.push(results[0][0]);
  }
  let hospname = await model.hospital(db);
  if (array[0] === undefined) res.render('error404')
  hospname = hospname.hospname
  let nDate = model.prettyDate(new Date())
  let i = 0;
  let fill = [];
  array.forEach(value => {
    fill[i] = ((value.max_qty - value.remain_qty) / value.qty).toFixed(0);
    fill[i] < 0 ? fill[i] = 1 : fill[i];
    value.remain_qty = (value.remain_qty / value.qty).toFixed(0);
    if (value.qty === null) value.qty = 0
    if (value.min_qty === null) value.min_qty = 0
    i++;
  });
  moment.locale('th');
  let sdate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543);
  res.render('listpurchase', { fill: fill, nDate: nDate, hospname: hospname, results: array, printDate: printDate(req.decoded.SYS_PRINT_DATE) })
}));

router.get('/report/list/purchase-orders-reserved', wrap(async (req, res, next) => {
  let reserve_id = req.query.r;
  let db = req.db;

  reserve_id = Array.isArray(reserve_id) ? reserve_id : [reserve_id]
  let results = await model.getReservedOrdered(db, reserve_id);

  for (const rs of results) {
    rs.total_cost = model.comma(rs.purchase_cost * rs.order_qty)
    rs.purchase_cost = model.comma(rs.purchase_cost)
    rs.order_qty = model.commaQty(rs.order_qty)
  }
  let hospitalDetail = await model.hospital(db);
  moment.locale('th');
  res.render('listReservedOrdered', { hospitalDetail: hospitalDetail, results: results, printDate: printDate(req.decoded.SYS_PRINT_DATE) })
}));

router.get('/report/list/order-point', wrap(async (req, res, next) => {
  let warehouseId = req.query.warehouseId;
  let db = req.db;


  let hospitalDetail = await model.hospital(db);
  let results = await model.orderPoint(db, warehouseId);
  results = results[0]

  // for (const rs of results) {
  //   rs.total_cost = model.comma(rs.purchase_cost * rs.order_qty)
  //   rs.purchase_cost = model.comma(rs.purchase_cost)
  //   rs.order_qty = model.commaQty(rs.order_qty)
  // }
  moment.locale('th');
  res.render('listOrderPoint', { hospitalDetail: hospitalDetail, results: results, printDate: printDate(req.decoded.SYS_PRINT_DATE) })
}));

router.get('/report/list/purchase-orders-reserved/excel', wrap(async (req, res, next) => {
  let reserve_id = req.query.r;
  let db = req.db;

  let hospitalDetail = await model.hospital(db);
  reserve_id = Array.isArray(reserve_id) ? reserve_id : [reserve_id]
  let results = await model.getReservedOrdered(db, reserve_id);

  for (const rs of results) {
    rs.total_cost = model.comma(rs.purchase_cost * rs.order_qty)
    rs.purchase_cost = model.comma(rs.purchase_cost)
    rs.order_qty = model.commaQty(rs.order_qty)
  }
  moment.locale('th');
  let json = [];

  results.forEach(v => {
    let obj: any = {};
    obj.generic_code = v.working_code;
    obj.generic_name = v.generic_name;
    obj.product_name = v.product_name;
    obj.labeler_name = v.labeler_name;
    obj.generic_type_name = v.generic_type_name;
    obj.contract_no = v.contract_no;
    obj.purchase_cost = v.purchase_cost;
    obj.order_qty = v.order_qty;
    obj.unit = v.from_unit_name + ' (' + v.conversion_qty + ' ' + v.to_unit_name + ')';
    obj.total_cost = v.total_cost;
    obj.tmt_id = v.tmt_id;
    obj.std_code = v.std_code;
    obj.description = v.description;
    obj.nin = v.nin;
    obj.standard_cost = v.standard_cost;
    obj.base_unit = v.to_unit_name;
    obj.conversion_qty = v.conversion_qty;
    obj.large_unit = v.from_unit_name;
    json.push(obj);
  });

  const xls = json2xls(json);
  const exportDirectory = path.join(process.env.MMIS_DATA, 'exports');
  // create directory
  fse.ensureDirSync(exportDirectory);
  const filePath = path.join(exportDirectory, 'รายการรอออกใบสั่งซื้อ.xlsx');
  fs.writeFileSync(filePath, xls, 'binary');
  // force download
  res.download(filePath, 'รายการรอออกใบสั่งซื้อ.xlsx');
  // res.render('listReservedOrdered', { hospitalDetail: hospitalDetail, results: results, printDate: printDate(req.decoded.SYS_PRINT_DATE) })
}));

router.get('/report/list/purchase/:startdate/:enddate', wrap(async (req, res, next) => {
  let startdate = req.params.startdate;
  let enddate = req.params.enddate;
  let db = req.db;
  let results = await model.lPurchase(db, startdate, enddate);
  let hospname = await model.hospital(db);
  results = results[0]
  if (results[0] === undefined) res.render('error404')
  hospname = hospname.hospname
  let nDate = model.prettyDate(new Date())
  results.forEach(value => {
    if (value.qty === null) value.qty = 0
    if (value.min_qty === null) value.min_qty = 0
  });
  moment.locale('th');
  let edate = moment(enddate).format('D MMMM ') + (moment(enddate).get('year') + 543);

  res.render('listpurchase', { nDate: nDate, hospname: hospname, results: results, printDate: printDate(req.decoded.SYS_PRINT_DATE), edate: edate })
}));

router.get('/report/total/purchase/:createDate', wrap(async (req, res, next) => {
  let createDate = req.params.createDate;
  let db = req.db;
  let nDate = createDate
  createDate = '%' + createDate + '%'

  let results = await model.tPurchase(db, createDate);
  let hospname = await model.hospital(db);
  results = results[0]
  hospname = hospname.hospname
  moment.locale('th')
  nDate = moment(nDate).format('MMMM ') + (moment(nDate).get('year') + 543);
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


router.get('/report/month/purchase', wrap(async (req, res, next) => {
  let db = req.db;

  let results = await model.mPurchase(db);
  let hospname = await model.hospital(db);
  results = results[0]
  hospname = hospname.hospname
  let nDate = model.prettyDate(new Date());
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
  hospname = hospname.hospname
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

  res.render('processpurchase', {
    results: results,
    hospname: hospname,
    daten: daten,
    dates: dates,
    sum: sum,
    sum1: sum1,
    sum2: sum2
  })
}));

router.get('/report/purchasing', wrap(async (req, res, next) => {
  let startdate = req.query.startdate;
  let db = req.db;
  let results = await model.pPurchasing(db, moment(startdate).format('YYYY-MM-DD'));
  const hospitalDetail = await model.hospital(db);
  results = results[0]
  moment.locale('th');
  let sdate = moment(startdate).format('D MMMM ') + (moment(startdate).get('year') + 543)
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

  res.render('pPurchasing', {
    results: results,
    hospitalDetail: hospitalDetail,
    sum: sum,
    sdate: sdate,
  })
}));

router.get('/report/purchasing-list', wrap(async (req, res, next) => {
  let startdate = req.query.startDate;
  let enddate = req.query.endDate;
  let generic_type_id = req.query.genericTypeId;
  let db = req.db;
  let results = await model.PurchasingList(db, startdate, enddate, generic_type_id);
  let hospname = await model.hospital(db);
  if (!results[0].length) { res.render('error404') };
  results = results[0]
  hospname = hospname.hospname
  moment.locale('th');
  let sdate = moment(startdate).format('D MMMM ') + (moment(startdate).get('year') + 543);
  let edate = moment(enddate).format('D MMMM ') + (moment(enddate).get('year') + 543);
  // let nDate = moment(new Date()).format('DD MMMM YYYY');
  let dates = moment(startdate).format('MMMM');
  let daten = moment(enddate).format('MMMM');
  let sum: any = 0;

  results.forEach(value => {
    sum += value.total_price;
    value.order_date = moment(value.order_date).isValid() ? moment(value.order_date).format('DD/MM/') + (moment(value.order_date).get('year') + 543) : '-';
    value.delivery_date = moment(value.delivery_date).isValid() ? moment(value.delivery_date).format('DD/MM/') + (moment(value.delivery_date).get('year') + 543) : '-';
    value.unit_price = model.comma(value.unit_price)
    value.conversion = model.commaQty(value.conversion)
    value.qty = model.commaQty(value.qty)
    value.total_price = model.comma(value.total_price)
  });
  sum = model.comma(sum)

  res.render('pPurchasingList', {
    results: results,
    hospname: hospname,
    daten: daten,
    dates: dates,
    sum: sum,
    printDate: printDate(req.decoded.SYS_PRINT_DATE),
    sdate: sdate,
    edate: edate
  })
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
  hospname = hospname.hospname
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

  res.render('pPurchasing', {
    results: results,
    hospname: hospname,
    daten: daten,
    dates: dates,
    sum: sum,
    nDate: nDate,
    sdate: sdate,
    edate: edate
  })
}));

// router.get('/report/totalcost/purchase/:month', wrap(async (req, res, next) => {
//   let db = req.db
//   let month = req.params.month
//   if (month.length == 1) month = '0' + month
//   let year = moment(new Date()).get('year') + 543
//   let years = moment(new Date()).get('year')
//   let smonth = years + '-' + month + '-01'
//   let emonth = years + '-' + month + '-31'

//   let type1 = await model.sumType1(db, smonth, emonth)
//   let type2 = await model.sumType2(db, smonth, emonth)
//   type1 = type1[0]
//   type2 = type2[0]
//   let hosdetail = await model.hospital(db);
//   let hospitalName = hosdetail.hospname;
//   moment.locale('th');
//   let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543);
//   let thmonth = moment(month).format('MMMM')
//   let sum: any = 0
//   type1.forEach(v => {
//     sum += v.total_price
//     if (v.total_price == null) v.total_price = 0
//     v.total_price = model.comma(v.total_price)
//   });
//   type2.forEach(v => {
//     sum += v.total_price
//     if (v.total_price == null) v.total_price = 0
//     v.total_price = model.comma(v.total_price)
//   });

//   sum = model.comma(sum)
//   res.render('totalcostpurchase', {
//     type1: type1,
//     type2: type2,
//     hospname: hospitalName,
//     nDate: nDate,
//     thmonth: thmonth,
//     year: year,
//     sum: sum,
//     printDate: printDate(req.decoded.SYS_PRINT_DATE)
//   })
// }));

// router.get('/test', wrap(async (req, res, next) => {
//   let db = req.db;
//   moment.locale('th');
//   let purchaOrderId = req.query.purchase_order_id;
//   let type = req.query.type;
//   let purchasing = await model.purchasing(db, purchaOrderId);
//   purchasing = purchasing[0];
//   let committeesVerify = await model.getCommitteeVerify(db, purchasing.verify_committee_id);
//   let committeesCheck = await model.getCommitteeVerify(db, purchasing.check_price_committee_id);
//   let count = await model.purchasingCountItem(db, purchaOrderId);
//   count = count[0][0].count || 0;

//   let hosdetail = await model.hospital(db);
//   let hospitalName = hosdetail.hospname;
//   let orderDate = moment(purchasing.order_date).format('D MMMM ') + (moment(purchasing.order_date).get('year') + 543);

//   let purchasingOfficer = await model.getPurchasingOfficer(db);
//   let inventoryBossName = _.find(purchasingOfficer, { 'type_id': 2 });
//   let directorName = _.find(purchasingOfficer, { 'type_id': 1 });
//   res.render('test', {
//     committeesVerify: committeesVerify,
//     committeesCheck: committeesVerify,
//     hospitalName: hospitalName,
//     orderDate: orderDate,
//     purchasing: purchasing,
//     type: type,
//     pricetext: model.bahtText(purchasing.total_price) || 0,
//     count: count,
//     purchasingOfficer: purchasingOfficer,
//     inventoryBossName: inventoryBossName,
//     directorName: directorName

//   });
// }));

// router.get('/report/purchasing/1/:purchaOrderId/:type', wrap(async (req, res, next) => {
//   let db = req.db;
//   let type = req.params.type;
//   let purchaOrderId = req.params.purchaOrderId;

//   let hosdetail = await model.hospital(db);
//   let hospitalName = hosdetail.hospname;
//   let purchasing = await model.purchasing(db, purchaOrderId);

//   purchasing = purchasing[0];
//   let count = await model.purchasingCountItem(db, purchaOrderId);
//   count = count[0];
//   count = count[0].count;
//   let pricetext = model.bahtText(purchasing[0].total_price);
//   let committee = await model.getCommitteeVerify(db, purchasing.verify_committee_id);

//   committee = committee[0];
//   let committee1 = committee ? committee[0].title_name + committee[0].fname + ' ' + committee[0].lname + ' ' + committee[0].position2 + ' เป็น' + committee[0].position_name : '';
//   let committee2 = committee ? committee[1].title_name + committee[1].fname + ' ' + committee[1].lname + ' ' + committee[1].position2 + ' เป็น' + committee[1].position_name : '';
//   let committee3 = committee ? committee[2].title_name + committee[2].fname + ' ' + committee[2].lname + ' ' + committee[2].position2 + ' เป็น' + committee[2].position_name : '';

//   moment.locale('th');
//   let nDate = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543);

//   let committeecheck = await model.purchasingCommitteeCheck(db, purchaOrderId);
//   committeecheck = committeecheck[0];
//   let committeecheck1 = committeecheck ? committeecheck[0].title_name + committeecheck[0].fname + ' ' + committeecheck[0].lname : '';
//   let committeecheckpos1 = committeecheck ? committeecheck[0].position2 : '';
//   let committeecheck2 = committeecheck ? committeecheck[1].title_name + committeecheck[1].fname + ' ' + committeecheck[1].lname : '';
//   let committeecheckpos2 = committeecheck ? committeecheck[1].position2 : '';
//   let committeecheck3 = committeecheck ? committeecheck[2].title_name + committeecheck[2].fname + ' ' + committeecheck[2].lname : '';
//   let committeecheckpos3 = committeecheck ? committeecheck[2].position2 : '';

//   purchasing.forEach(value => {
//     value.total_price = model.comma(value.total_price);
//   })

//   res.render('purchasing', {
//     hospitalName: hospitalName,
//     type: type,
//     purchasing: purchasing,
//     count: count,
//     pricetext: pricetext,
//     nDate: nDate,
//     committee1: committee1,
//     committee2: committee2,
//     committee3: committee3,
//     committeecheck1: committeecheck1,
//     committeecheck2: committeecheck2,
//     committeecheck3: committeecheck3,
//     committeecheckpos1: committeecheckpos1,
//     committeecheckpos2: committeecheckpos2,
//     committeecheckpos3: committeecheckpos3
//   });
// }));

// router.post('/report/purchasingorder', wrap(async (req, res, next) => {
//   let purchasOrderId = req.body.orderId;

//   let num = purchasOrderId.length;
//   let db = req.db;
//   let hospname = await model.hospital(db)
//   let hospAddress = hospname.address
//   let hopsTel = hospname.telephone
//   let hopsprovince = hospname.province
//   hospname = hospname.hospname

//   let nDate = moment(new Date()).format('DD MMMM ') + (moment(new Date()).get('year') + 543)
//   let array = [];
//   let array1 = [];
//   let arrayDate = [];
//   for (let i = 0; i < num; i++) {
//     let results = await model.purchasingOrder(db, purchasOrderId[i])
//     results = results[0];
//     let order_date = moment(results.order_date).format('DD MMMM ') + (moment(results.order_date).get('year') + 543)
//     arrayDate.push(order_date);
//     array.push(results);

//     let getchief = await model.purchasing2Chief(db, purchasOrderId[i]);
//     getchief = getchief[0].chief_fullname;
//     array1.push(getchief);
//     console.log(getchief);

//   }
//   res.render('porders', {
//     arrayDate: arrayDate,
//     array: array,
//     num: num,
//     hospname: hospname,
//     getchief: array1,
//     nDate: nDate,
//     hospAddress: hospAddress,
//     hopsTel: hopsTel,
//     hopsprovince: hopsprovince
//   });
// }));

// router.get('/report/getporder', wrap(async (req, res, next) => {
//   let porder = req.query.porder
//   let db = req.db;

//   let hospname = await model.hospital(db)
//   let hospAddress = hospname.address
//   let hopsTel = hospname.telephone
//   let hopsprovince = hospname.province
//   hospname = hospname.hospname
//   moment.locale('th');
//   let nDate = moment(new Date()).format('DD MMMM ') + (moment(new Date()).get('year') + 543)
//   let array = [];
//   let array1 = [];
//   let arraySum = [];
//   let arraySumText = [];

//   for (let i = 0; i < porder.length; i++) {
//     let sum: any = 0;
//     let sumtext: any = ""
//     let results = await model.purchasingOrder(db, porder[i])
//     results = results[0];
//     array.push(results);
//     results.forEach(value => {
//       sum += value.total;
//       value.total = model.comma(value.total)
//     });
//     sumtext = model.bahtText(sum)
//     sum = model.comma(sum);
//     arraySum.push(sum)
//     arraySumText.push(sumtext)

//     let getchief = await model.purchasing2Chief(db, porder[i]);
//     getchief = getchief[0].chief_fullname;
//     array1.push(getchief);
//   }
//   res.render('porders', {
//     arraySum: arraySum,
//     arraySumText: arraySumText,
//     array: array,
//     num: porder.length,
//     hospname: hospname,
//     getchief: array1,
//     nDate: nDate,
//     hospAddress: hospAddress,
//     hopsTel: hopsTel,
//     hopsprovince: hopsprovince
//   })
// }));


router.get('/report/getProductHistory/:generic_code', wrap(async (req, res, next) => {
  let db = req.db;
  let generic_code = req.params.generic_code;
  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail.hospname;
  let hostel = hosdetail.telephone;
  let hosaddress = hosdetail.address;

  let rs: any = await model.getProductHistory(db, generic_code);

  res.render('purchaseHistory', {
    hospitalName: hospitalName,
    printDate: printDate(req.decoded.SYS_PRINT_DATE)
  });
}));

router.get('/report/purchasing-list/excel', async (req, res, next) => {
  let startdate = req.query.startDate;
  let enddate = req.query.endDate;
  let generic_type_id = req.query.genericTypeId;
  let db = req.db;
  let results = await model.PurchasingList(db, startdate, enddate, generic_type_id);
  let hospname = await model.hospital(db);
  if (!results[0].length) { res.render('error404') };
  results = results[0]
  hospname = hospname.hospname
  moment.locale('th');
  let sum: any = 0;
  startdate = moment(startdate).format('DD-MM-') + (moment(startdate).get('year') + 543)
  enddate = moment(enddate).format('DD-MM-') + (moment(enddate).get('year') + 543)

  results.forEach(value => {
    sum += value.total_price;
    value.order_date = moment(value.order_date).isValid() ? moment(value.order_date).format('DD/MM/') + (moment(value.order_date).get('year') + 543) : '-';
    value.delivery_date = moment(value.delivery_date).isValid() ? moment(value.delivery_date).format('DD/MM/') + (moment(value.delivery_date).get('year') + 543) : '-';
    value.unit_price = model.comma(value.unit_price)
    value.conversion = model.commaQty(value.conversion)
    value.qty = model.commaQty(value.qty)
    value.total_price = model.comma(value.total_price)
  });
  sum = model.comma(sum)
  let json = [];

  results.forEach(v => {
    let obj: any = {};
    obj.purchase_order_number = v.purchase_order_number;
    obj.purchase_order_book_number = v.purchase_order_book_number;
    obj.order_date = v.order_date;
    obj.product_name = v.product_name;
    obj.qty = v.qty;
    obj.unit_price = v.unit_price;
    obj.primary_unit = v.primary_unit;
    obj.conversion = v.conversion;
    obj.total_price = v.total_price;
    obj.labeler_name_po = v.labeler_name_po;
    obj.delivery_date = v.delivery_date;
    obj.delivery_code = v.delivery_code;
    obj.sum = ''
    json.push(obj);
  });

  json[json.length - 1].sum = sum

  const xls = json2xls(json);
  const exportDirectory = path.join(process.env.MMIS_DATA, 'exports');
  // create directory
  fse.ensureDirSync(exportDirectory);
  const filePath = path.join(exportDirectory, 'รายงานสรุปรายการเวชภัณฑ์ที่สั่งซื้อ ตั้งแต่ ' + startdate + ' ถึง ' + enddate + '.xlsx');
  fs.writeFileSync(filePath, xls, 'binary');
  // force download
  res.download(filePath, 'รายงานสรุปรายการเวชภัณฑ์ที่สั่งซื้อ ตั้งแต่ ' + startdate + ' ถึง ' + enddate + '.xlsx');
});

router.get('/report/budget-history', wrap(async (req, res, next) => {
  let db = req.db;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;
  let budgetDetailId = req.query.budgetDetailId;
  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail.hospname;
  let hostel = hosdetail.telephone;
  let hosaddress = hosdetail.address;
  moment.locale('th');
  let sdate = moment(startDate).format('D MMMM ') + (moment(startDate).get('year') + 543);
  let edate = moment(endDate).format('D MMMM ') + (moment(endDate).get('year') + 543);

  let results: any = await model.getHudgetHistory(db, startDate, endDate, budgetDetailId);
  results = results[0];

  if (results.length == 0) {
    res.render('error404')
  }

  results.forEach(value => {
    value.date_time = moment(value.date_time).isValid() ? moment(value.date_time).format('DD/MM/') + (moment(value.date_time).get('year') + 543) : '-';
    value.incoming_balance = model.comma(value.incoming_balance)
    if (value.amount < 0) {
      value.amount = value.amount * -1
    }
    value.amount = model.comma(value.amount)
    value.balance = model.comma(value.balance)
  });

  res.render('budgetHistory', {
    hospitalName: hospitalName,
    results: results,
    sdate: sdate,
    edate: edate
  });
}));

router.get('/report/budget-history/excel', wrap(async (req, res, next) => {
  let db = req.db;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;
  let budgetDetailId = req.query.budgetDetailId;
  let hosdetail = await model.hospital(db);
  let hospitalName = hosdetail.hospname;
  let hostel = hosdetail.telephone;
  let hosaddress = hosdetail.address;
  moment.locale('th');
  let sdate = moment(startDate).format('D MMMM ') + (moment(startDate).get('year') + 543);
  let edate = moment(endDate).format('D MMMM ') + (moment(endDate).get('year') + 543);
  let json = [];

  let results: any = await model.getHudgetHistory(db, startDate, endDate, budgetDetailId);
  results = results[0];

  if (results.length == 0) {
    res.render('error404')
  }

  results.forEach(value => {
    value.date_time = moment(value.date_time).isValid() ? moment(value.date_time).format('DD/MM/') + (moment(value.date_time).get('year') + 543) : '-';
    value.incoming_balance = model.comma(value.incoming_balance)
    if (value.amount < 0) {
      value.amount = value.amount * -1
    }
    value.amount = model.comma(value.amount)
    value.balance = model.comma(value.balance)
  });

  results.forEach(v => {
    let obj: any = {};
    obj.date = v.date_time;
    obj.purchase_order_number = v.purchase_order_book_number || v.purchase_order_number
    obj.incoming_balance = v.incoming_balance
    obj.amount = v.amount
    obj.balance = v.balance
    if (obj.amount >= 0) {
      obj.status = 'ตัดงบ'
    } else {
      obj.status = 'คืนงบ'
    }
    json.push(obj);
  });

  const xls = json2xls(json);
  const exportDirectory = path.join(process.env.MMIS_DATA, 'exports');
  // create directory
  fse.ensureDirSync(exportDirectory);
  const filePath = path.join(exportDirectory, 'รายงานประวัติการใช้งบประมาณ ตั้งแต่ ' + sdate + ' ถึง ' + edate + '.xlsx');
  fs.writeFileSync(filePath, xls, 'binary');
  // force download
  res.download(filePath, 'รายงานประวัติการใช้งบประมาณตั้งแต่ ตั้งแต่ ' + sdate + ' ถึง ' + edate + '.xlsx');
}));

router.get('/report/purchasing-list/byPO', wrap(async (req, res, next) => {
  let Sid = req.query.Sid;
  let Eid = req.query.Eid;
  let generic_type_id = req.query.genericTypeId;
  let db = req.db;
  let results = await model.PurchasingListByPO(db, Sid, Eid, generic_type_id);
  let hospname = await model.hospital(db);
  if (!results[0].length) { res.render('error404') };
  results = results[0]
  hospname = hospname.hospname
  moment.locale('th');
  let startPO = Sid;
  let endPO = Eid;

  let sum: any = 0;

  results.forEach(value => {
    sum += value.total_price;
    value.order_date = moment(value.order_date).isValid() ? moment(value.order_date).format('DD/MM/') + (moment(value.order_date).get('year') + 543) : '-';
    value.delivery_date = moment(value.delivery_date).isValid() ? moment(value.delivery_date).format('DD/MM/') + (moment(value.delivery_date).get('year') + 543) : '-';
    value.unit_price = model.comma(value.unit_price)
    value.conversion = model.commaQty(value.conversion)
    value.qty = model.commaQty(value.qty)
    value.total_price = model.comma(value.total_price)
  });
  sum = model.comma(sum)

  res.render('pPurchasingListByPO', {
    results: results,
    hospname: hospname,
    sum: sum,
    printDate: printDate(req.decoded.SYS_PRINT_DATE),
    startPO: startPO,
    endPO: endPO
  })
}));

router.get('/report/purchasing-list/byPO/excel', async (req, res, next) => {
  let Sid = req.query.Sid;
  let Eid = req.query.Eid;
  let generic_type_id = req.query.genericTypeId;
  let db = req.db;
  let results = await model.PurchasingListByPO(db, Sid, Eid, generic_type_id);
  let hospname = await model.hospital(db);
  if (!results[0].length) { res.render('error404') };
  results = results[0]
  hospname = hospname.hospname
  moment.locale('th');
  let sum: any = 0;

  results.forEach(value => {
    sum += value.total_price;
    value.order_date = moment(value.order_date).isValid() ? moment(value.order_date).format('DD/MM/') + (moment(value.order_date).get('year') + 543) : '-';
    value.delivery_date = moment(value.delivery_date).isValid() ? moment(value.delivery_date).format('DD/MM/') + (moment(value.delivery_date).get('year') + 543) : '-';
    value.unit_price = model.comma(value.unit_price)
    value.conversion = model.commaQty(value.conversion)
    value.qty = model.commaQty(value.qty)
    value.total_price = model.comma(value.total_price)
  });
  sum = model.comma(sum)
  let json = [];

  results.forEach(v => {
    let obj: any = {};
    obj.purchase_order_number = v.purchase_order_number;
    obj.purchase_order_book_number = v.purchase_order_book_number;
    obj.order_date = v.order_date;
    obj.product_name = v.product_name;
    obj.qty = v.qty;
    obj.primary_unit = v.primary_unit;
    obj.conversion = v.conversion;
    obj.total_price = v.total_price;
    obj.labeler_name_po = v.labeler_name_po;
    obj.delivery_date = v.delivery_date;
    obj.delivery_code = v.delivery_code;
    obj.sum = ''
    json.push(obj);
  });

  json[json.length - 1].sum = sum

  const xls = json2xls(json);
  const exportDirectory = path.join(process.env.MMIS_DATA, 'exports');
  // create directory
  fse.ensureDirSync(exportDirectory);
  const filePath = path.join(exportDirectory, 'รายงานสรุปรายการเวชภัณฑ์ที่สั่งซื้อ เลขที่ใบสั่งซื้อ ' + Sid + ' ถึง ' + Eid + '.xlsx');
  fs.writeFileSync(filePath, xls, 'binary');
  // force download
  res.download(filePath, 'รายงานสรุปรายการเวชภัณฑ์ที่สั่งซื้อ เลขที่ใบสั่งซื้อ ' + Sid + ' ถึง ' + Eid + '.xlsx');
});

router.get('/account/payable', wrap(async (req, res, next) => {
  try {
    const db = req.db;
    const purchaseOrderId = typeof req.query.purchaseOrderId == "string" ? [req.query.purchaseOrderId] : req.query.purchaseOrderId;
    const sys_hospital = req.decoded.SYS_HOSPITAL;
    const hospname = JSON.parse(sys_hospital).hospname;
    const rs: any = await model.accountPayable(db, purchaseOrderId);
    if (rs.length > 0) {
      const sum = model.comma(_.sumBy(rs, function (o: any) { return o.cost; }));
      for (const i of rs) {
        i.cost = model.comma(i.cost);
        i.delivery_date = moment(i.delivery_date).format('D MMMM ') + (moment(i.delivery_date).get('year') + 543);
      }
      res.render('account_payable', {
        hospname: hospname,
        details: rs,
        sumCost: sum,
        printDate: printDate(req.decoded.SYS_PRINT_DATE)
      });
    } else {
      res.render('error404')
    }

  } catch (error) {
    res.render('error404', {
      title: error
    })
  }
}));
export default router;