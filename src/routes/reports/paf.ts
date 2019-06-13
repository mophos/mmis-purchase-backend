'use strict';

import * as express from 'express';
import * as moment from 'moment';
import * as wrap from 'co-express';
import { PafModel } from '../../models/reports/paf';
import { BasicModel } from '../../models/reports/basic';


const router = express.Router();
const model = new PafModel();
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
    const type = req.query.type;
    const purchaOrderId = Array.isArray(req.query.purchaOrderId) ? req.query.purchaOrderId : [req.query.purchaOrderId];
    const warehouseId = req.decoded.warehouseId;
    const hospitalDetail = await basicModel.hospital(db);
    hospitalDetail.chief = chief;
    moment.locale('th');

    const header = await model.purchasingHeader(db, purchaOrderId);
    for (const i of header) {
        i.poNumber = i.purchase_order_book_number ? i.purchase_order_book_number : i.purchase_order_number;
        i.chief = await getOfficer(db, i.chief_id);
        i.buyer = await getOfficer(db, i.buyer_id);
        i.manager = await getOfficer(db, i.manager_id);
        i.committee = await getCommitee(db, i.verify_committee_id);
        i.budget_amount = basicModel.comma(i.budget_amount);
        i.at = await basicModel.at(db)//book_prefix
        i.standard_cost = i.standard_cost === 0 ? i.unit_price : i.standard_cost;
        let getAmountTransaction = await model.allAmountTransaction(db, i.budget_detail_id, i.purchase_order_id);
        i.transection_balance = basicModel.comma(i.transection_balance);
        i.allAmount = basicModel.comma(getAmountTransaction[0].amount);
        i.budget_year = +i.budget_year + 543;

        const deliveryDate = moment(i.order_date).add(i.delivery, 'days');
        i.limitDate = (moment(deliveryDate).format('D MMMM ') + (moment(deliveryDate).get('year') + 543));
        i.bahtText = basicModel.bahtText(i.total_price);
        i.total_price = basicModel.comma(i.total_price);
        i.sub_total = basicModel.comma(i.sub_total);
        i.net = basicModel.comma(i.net);
        i.vat = basicModel.comma(i.vat);
        i.order_date = moment(i.order_date).format('D MMMM ') + (moment(i.order_date).get('year') + 543);
        let arrayItems = await model.purchasingPAF(db, i.purchase_order_id, warehouseId);
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
    }

    res.render('paf/paf1', {
        type: type,
        hospitalDetail: hospitalDetail,
        header: header
    });
}));


router.get('/2', wrap(async (req, res, next) => {
    let db = req.db;
    let type = req.query.type;
    const purchaOrderId = Array.isArray(req.query.purchaOrderId) ? req.query.purchaOrderId : [req.query.purchaOrderId];
    const warehouseId = req.decoded.warehouseId;
    const hospitalDetail = await basicModel.hospital(db);
    hospitalDetail.chief = chief;
    moment.locale('th');
    const header = await model.purchasingHeader(db, purchaOrderId);
    for (const i of header) {
        i.poNumber = i.purchase_order_book_number ? i.purchase_order_book_number : i.purchase_order_number;
        i.chief = await getOfficer(db, i.chief_id);
        i.buyer = await getOfficer(db, i.buyer_id);
        i.manager = await getOfficer(db, i.manager_id);
        i.committee = await getCommitee(db, i.verify_committee_id);
        i.budget_amount = basicModel.comma(i.budget_amount);
        i.at = await basicModel.at(db)//book_prefix
        i.standard_cost = i.standard_cost === 0 ? i.unit_price : i.standard_cost;
        let getAmountTransaction = await model.allAmountTransaction(db, i.budget_detail_id, i.purchase_order_id);
        i.transection_balance = basicModel.comma(i.transection_balance);
        i.allAmount = basicModel.comma(getAmountTransaction[0].amount);
        i.budget_year = +i.budget_year + 543;

        const deliveryDate = moment(i.order_date).add(i.delivery, 'days');
        i.limitDate = (moment(deliveryDate).format('D MMMM ') + (moment(deliveryDate).get('year') + 543));
        i.bahtText = basicModel.bahtText(i.total_price);
        i.total_price = basicModel.comma(i.total_price);
        i.sub_total = basicModel.comma(i.sub_total);
        i.net = basicModel.comma(i.net);
        i.vat = basicModel.comma(i.vat);
        i.order_date = moment(i.order_date).format('D MMMM ') + (moment(i.order_date).get('year') + 543);
        let arrayItems = await model.purchasingPAF(db, i.purchase_order_id, warehouseId);
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
    }

    res.render('paf/paf2', {
        type: type,
        hospitalDetail: hospitalDetail,
        header: header
    });
}));

router.get('/3', wrap(async (req, res, next) => {
    let db = req.db;
    let type = req.query.type;
    const purchaOrderId = Array.isArray(req.query.purchaOrderId) ? req.query.purchaOrderId : [req.query.purchaOrderId];
    const warehouseId = req.decoded.warehouseId;
    const hospitalDetail = await basicModel.hospital(db);
    hospitalDetail.chief = chief;
    moment.locale('th');
    const header = await model.purchasingHeader(db, purchaOrderId);
    for (const i of header) {
        i.poNumber = i.purchase_order_book_number ? i.purchase_order_book_number : i.purchase_order_number;
        i.chief = await getOfficer(db, i.chief_id);
        i.buyer = await getOfficer(db, i.buyer_id);
        i.manager = await getOfficer(db, i.manager_id);
        i.committee = await getCommitee(db, i.verify_committee_id);
        i.budget_amount = basicModel.comma(i.budget_amount);
        i.at = await basicModel.at(db)//book_prefix
        i.standard_cost = i.standard_cost === 0 ? i.unit_price : i.standard_cost;
        let getAmountTransaction = await model.allAmountTransaction(db, i.budget_detail_id, i.purchase_order_id);
        i.transection_balance = basicModel.comma(i.transection_balance);
        i.allAmount = basicModel.comma(getAmountTransaction[0].amount);
        i.budget_year = +i.budget_year + 543;

        const deliveryDate = moment(i.order_date).add(i.delivery, 'days');
        i.limitDate = (moment(deliveryDate).format('D MMMM ') + (moment(deliveryDate).get('year') + 543));
        i.bahtText = basicModel.bahtText(i.total_price);
        i.total_price = basicModel.comma(i.total_price);
        i.sub_total = basicModel.comma(i.sub_total);
        i.net = basicModel.comma(i.net);
        i.vat = basicModel.comma(i.vat);
        i.order_date = moment(i.order_date).format('D MMMM ') + (moment(i.order_date).get('year') + 543);
        let arrayItems = await model.purchasingPAF(db, i.purchase_order_id, warehouseId);
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
    }

    res.render('paf/paf3', {
        type: type,
        hospitalDetail: hospitalDetail,
        header: header
    });
}));
export default router;