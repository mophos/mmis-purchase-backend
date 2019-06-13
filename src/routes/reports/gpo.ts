'use strict';

import * as express from 'express';
import * as moment from 'moment';
import * as wrap from 'co-express';
import { GpoModel } from '../../models/reports/gpo';
import { BasicModel } from '../../models/reports/basic';


const router = express.Router();
const model = new GpoModel();
const basicModel = new BasicModel();

let chief = "ปฎิบัติราชการแทนผู้ว่าราชการจังหวัด";

async function getOfficer(db, officerId) {
    const staff = await basicModel.getStaff(db, officerId);
    return staff[0] ? staff[0] : null;
}

async function getCommitee(db, committeeId) {
    let committee = await basicModel.purchasingCommittee(db, committeeId);
    if (committee.length == 1) {
        committee[0].position = 'ผู้ตรวจรับพัสดุ';
    }
    return committee.length ? committee : null;
}

router.get('/', wrap(async (req, res, next) => {
    const db = req.db;
    let type = req.query.type;
    const purchaOrderId = Array.isArray(req.query.purchaOrderId) ? req.query.purchaOrderId : [req.query.purchaOrderId];
    const warehouseId = req.decoded.warehouseId;
    const hospitalDetail = await basicModel.hospital(db);
    hospitalDetail.chief = chief;
    moment.locale('th');
    hospitalDetail.date = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
    hospitalDetail.month = moment(new Date()).format('MMMM ') + (moment(new Date()).get('year') + 543)

    const header = await model.purchasingHeader(db, purchaOrderId);
    for (let i of header) {
        i.type = type;
        i.poNumber = i.purchase_order_book_number ? i.purchase_order_book_number : i.purchase_order_number;
        const arrayItems = await model.purchasingPO(db, i.purchase_order_id, warehouseId);
        arrayItems.forEach(v => {
            if (v.giveaway == 'Y') {
                v.sumcost = basicModel.comma(0.00)
            } else {
                v.sumcost = basicModel.comma(v.qty * v.unit_price)
            }
            v.total_price_item = basicModel.comma(v.total_price_item);
            v.balance_qty = basicModel.commaQty(v.balance_qty);
            v.unit_price = basicModel.comma(v.unit_price);
            v.qty = basicModel.commaQty(v.qty);
            v.standard_cost = basicModel.comma(v.standard_cost);
            v.cost = basicModel.comma(v.cost);
        });
        i.arrayItems = arrayItems;
        i.chief = await getOfficer(db, i.chief_id);
        i.buyer = await getOfficer(db, i.buyer_id);
        i.manager = await getOfficer(db, i.manager_id);
        i.committee = await getCommitee(db, i.verify_committee_id);
        i.budget_amount = basicModel.comma(i.budget_amount);

        let getAmountTransaction = await model.allAmountTransaction(db, i.budget_detail_id, i.purchase_order_id);
        i.transection_balance = basicModel.comma(i.transection_balance);
        i.allAmount = basicModel.comma(getAmountTransaction[0].amount);
        i.budget_year = +i.budget_year + 543;

        const deliveryDate = moment(i.order_date).add(i.delivery, 'days');
        i.limitDate = (moment(deliveryDate).format('D MMMM ') + (moment(deliveryDate).get('year') + 543));
        i.bahtText = basicModel.bahtText(i.total_price);
        i.total_price = basicModel.comma(i.total_price);
        i.sub_total = basicModel.comma(i.sub_total);
        i.vat = basicModel.comma(i.vat);
        i.order_date = moment(i.order_date).format('D MMMM ') + (moment(i.order_date).get('year') + 543);
    }

    res.render('gpo/gpo1', {
        hospitalDetail: hospitalDetail,
        header: header

    });
}));

router.get('/2', wrap(async (req, res, next) => {
    const db = req.db;
    const type = req.query.type;
    const purchaOrderId = Array.isArray(req.query.purchaOrderId) ? req.query.purchaOrderId : [req.query.purchaOrderId];
    const warehouseId = req.decoded.warehouseId;
    const hospitalDetail = await basicModel.hospital(db);
    hospitalDetail.chief = chief;
    moment.locale('th');
    hospitalDetail.date = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
    hospitalDetail.month = moment(new Date()).format('MMMM ') + (moment(new Date()).get('year') + 543)
    const header = await model.purchasingHeader(db, purchaOrderId);
    for (let i of header) {
        i.type = type;
        i.poNumber = i.purchase_order_book_number ? i.purchase_order_book_number : i.purchase_order_number;
        const arrayItems = await model.purchasingPO(db, i.purchase_order_id, warehouseId);
        arrayItems.forEach(v => {
            if (v.giveaway == 'Y') {
                v.sumcost = basicModel.comma(0.00)
            } else {
                v.sumcost = basicModel.comma(v.qty * v.unit_price)
            }
            v.total_price_item = basicModel.comma(v.total_price_item);
            v.balance_qty = basicModel.commaQty(v.balance_qty);
            v.unit_price = basicModel.comma(v.unit_price);
            v.qty = basicModel.commaQty(v.qty);
            v.standard_cost = basicModel.comma(v.standard_cost);
            v.cost = basicModel.comma(v.cost);
        });
        i.arrayItems = arrayItems;
        i.chief = await getOfficer(db, i.chief_id);
        i.buyer = await getOfficer(db, i.buyer_id);
        i.manager = await getOfficer(db, i.manager_id);
        i.committee = await getCommitee(db, i.verify_committee_id);
        i.budget_amount = basicModel.comma(i.budget_amount);

        let getAmountTransaction = await model.allAmountTransaction(db, i.budget_detail_id, i.purchase_order_id);
        i.transection_balance = basicModel.comma(i.transection_balance);
        i.allAmount = basicModel.comma(getAmountTransaction[0].amount);
        i.budget_year = +i.budget_year + 543;

        const deliveryDate = moment(i.order_date).add(i.delivery, 'days');
        i.limitDate = (moment(deliveryDate).format('D MMMM ') + (moment(deliveryDate).get('year') + 543));
        i.bahtText = basicModel.bahtText(i.total_price);
        i.total_price = basicModel.comma(i.total_price);
        i.sub_total = basicModel.comma(i.sub_total);
        i.vat = basicModel.comma(i.vat);
        i.order_date = moment(i.order_date).format('D MMMM ') + (moment(i.order_date).get('year') + 543);
    }

    res.render('gpo/gpo2', {
        hospitalDetail: hospitalDetail,
        header: header

    });
}));

router.get('/3', wrap(async (req, res, next) => {
    const db = req.db;
    const type = req.query.type;
    const purchaOrderId = Array.isArray(req.query.purchaOrderId) ? req.query.purchaOrderId : [req.query.purchaOrderId];
    const warehouseId = req.decoded.warehouseId;
    const hospitalDetail = await basicModel.hospital(db);
    hospitalDetail.chief = chief;
    moment.locale('th');
    hospitalDetail.date = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
    hospitalDetail.month = moment(new Date()).format('MMMM ') + (moment(new Date()).get('year') + 543)
    const header = await model.purchasingHeader(db, purchaOrderId);
    for (let i of header) {
        i.type = type;
        i.poNumber = i.purchase_order_book_number ? i.purchase_order_book_number : i.purchase_order_number;
        const arrayItems = await model.purchasingPO(db, i.purchase_order_id, warehouseId);
        arrayItems.forEach(v => {
            if (v.giveaway == 'Y') {
                v.sumcost = basicModel.comma(0.00)
            } else {
                v.sumcost = basicModel.comma(v.qty * v.unit_price)
            }
            v.total_price_item = basicModel.comma(v.total_price_item);
            v.balance_qty = basicModel.commaQty(v.balance_qty);
            v.unit_price = basicModel.comma(v.unit_price);
            v.qty = basicModel.commaQty(v.qty);
            v.standard_cost = basicModel.comma(v.standard_cost);
            v.cost = basicModel.comma(v.cost);
        });
        i.arrayItems = arrayItems;
        i.chief = await getOfficer(db, i.chief_id);
        i.buyer = await getOfficer(db, i.buyer_id);
        i.supply = await getOfficer(db, i.supply_id);
        i.manager = await getOfficer(db, i.manager_id);
        i.committee = await getCommitee(db, i.verify_committee_id);
        i.budget_amount = basicModel.comma(i.budget_amount);

        let getAmountTransaction = await model.allAmountTransaction(db, i.budget_detail_id, i.purchase_order_id);
        i.transection_balance = basicModel.comma(i.transection_balance);
        i.allAmount = basicModel.comma(getAmountTransaction[0].amount);
        i.budget_year = +i.budget_year + 543;

        const deliveryDate = moment(i.order_date).add(i.delivery, 'days');
        i.limitDate = (moment(deliveryDate).format('D MMMM ') + (moment(deliveryDate).get('year') + 543));
        i.bahtText = basicModel.bahtText(i.total_price);
        i.sub_total = basicModel.comma(i.sub_total);
        i.total_price = basicModel.comma(i.total_price);
        i.vat = basicModel.comma(i.vat);
        i.order_date = moment(i.order_date).format('D MMMM ') + (moment(i.order_date).get('year') + 543);
    }

    res.render('gpo/gpo3', {
        hospitalDetail: hospitalDetail,
        header: header

    });
}));


export default router;