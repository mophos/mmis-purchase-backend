'use strict';

import * as express from 'express';
import * as moment from 'moment';
import * as wrap from 'co-express';
import { PoModel } from '../../models/reports/po';
import { BasicModel } from '../../models/reports/basic';


const router = express.Router();
const model = new PoModel();
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
    const porder = Array.isArray(req.query.porder) ? req.query.porder : [req.query.porder];
    const warehouseId = req.decoded.warehouseId;
    const hospitalDetail = await basicModel.hospital(db);
    hospitalDetail.chief = chief;
    moment.locale('th');

    const header = await model.purchasingHeader(db, porder);
    for (let i of header) {
        i.poNumber = i.purchase_order_book_number ? i.purchase_order_book_number : i.purchase_order_number;
        const arrayItems = await model.purchasingPO(db, i.purchase_order_id, warehouseId);
        arrayItems.forEach(v => {
            if (v.giveaway == 'Y') {
                v.sumcost = basicModel.comma(0.00)
            } else {
                v.sumcost = basicModel.comma(v.qty * v.unit_price)
            }
            v.total_price = basicModel.comma(v.total_price);
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

        let getAmountTransaction = await model.allAmountTransaction(db, i.budget_detail_id, +i.budget_year - 543, i.purchase_order_id);
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
    }

    res.render('po/po1', {
        hospitalDetail: hospitalDetail,
        header: header

    });
}));

router.get('/2', wrap(async (req, res, next) => {
    const db = req.db;
    const porder = Array.isArray(req.query.porder) ? req.query.porder : [req.query.porder];
    const warehouseId = req.decoded.warehouseId;
    const hospitalDetail = await basicModel.hospital(db);
    hospitalDetail.chief = chief;
    moment.locale('th');
    hospitalDetail.date = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543)
    const header = await model.purchasingHeader(db, porder);
    for (let i of header) {
        i.poNumber = i.purchase_order_book_number ? i.purchase_order_book_number : i.purchase_order_number;
        const arrayItems = await model.purchasingPO(db, i.purchase_order_id, warehouseId);
        arrayItems.forEach(v => {
            if (v.giveaway == 'Y') {
                v.sumcost = basicModel.comma(0.00)
            } else {
                v.sumcost = basicModel.comma(v.qty * v.unit_price)
            }
            v.balance_qty = basicModel.commaQty(v.balance_qty);
            v.unit_price = basicModel.comma(v.unit_price);
            v.qty = basicModel.commaQty(v.qty);
            v.standard_cost = basicModel.comma(v.standard_cost);
            v.cost = basicModel.comma(v.cost);
            v.total_price_item_text = basicModel.bahtText(v.total_price_item);
            v.total_price_item = basicModel.comma(v.total_price_item);
        });
        i.arrayItems = arrayItems;
        i.bahtText = basicModel.bahtText(i.total_price);
        i.total_price = basicModel.comma(i.total_price);
        i.sub_total = basicModel.comma(i.sub_total);
        i.chief = await getOfficer(db, i.chief_id);
        i.buyer = await getOfficer(db, i.buyer_id);
        i.manager = await getOfficer(db, i.manager_id);
    }

    res.render('po/po2', {
        header: header,
        hospitalDetail: hospitalDetail

    })
}));

router.get('/3', wrap(async (req, res, next) => {
    const db = req.db;
    const porder = Array.isArray(req.query.porder) ? req.query.porder : [req.query.porder];
    const warehouseId = req.decoded.warehouseId;
    const hospitalDetail = await basicModel.hospital(db);
    hospitalDetail.chief = chief;
    moment.locale('th');

    const header = await model.purchasingHeader(db, porder);
    for (let i of header) {
        i.poNumber = i.purchase_order_book_number ? i.purchase_order_book_number : i.purchase_order_number;
        const arrayItems = await model.purchasingPO(db, i.purchase_order_id, warehouseId);
        arrayItems.forEach(v => {
            if (v.giveaway == 'Y') {
                v.sumcost = basicModel.comma(0.00)
            } else {
                v.sumcost = basicModel.comma(v.qty * v.unit_price)
            }
            v.total_price = basicModel.comma(v.total_price);
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

        let getAmountTransaction = await model.allAmountTransaction(db, i.budget_detail_id, +i.budget_year - 543, i.purchase_order_id);
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
    }

    res.render('po/po3', {
        hospitalDetail: hospitalDetail,
        header: header
    });
}));

router.get('/4', wrap(async (req, res, next) => {
    const db = req.db;
    const porder = Array.isArray(req.query.porder) ? req.query.porder : [req.query.porder];
    const warehouseId = req.decoded.warehouseId;
    const hospitalDetail = await basicModel.hospital(db);
    hospitalDetail.chief = chief;
    moment.locale('th');

    const header = await model.purchasingHeader(db, porder);
    for (let i of header) {
        i.poNumber = i.purchase_order_book_number ? i.purchase_order_book_number : i.purchase_order_number;
        const arrayItems = await model.purchasingPO(db, i.purchase_order_id, warehouseId);
        arrayItems.forEach(v => {
            if (v.giveaway == 'Y') {
                v.sumcost = basicModel.comma(0.00)
            } else {
                v.sumcost = basicModel.comma(v.qty * v.unit_price)
            }
            v.total_price = basicModel.comma(v.total_price);
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

        let getAmountTransaction = await model.allAmountTransaction(db, i.budget_detail_id, +i.budget_year - 543, i.purchase_order_id);
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
    }

    res.render('po/po4', {
        hospitalDetail: hospitalDetail,
        header: header
    });
}));

router.get('/5', wrap(async (req, res, next) => {
    const db = req.db;
    const porder = Array.isArray(req.query.porder) ? req.query.porder : [req.query.porder];
    const warehouseId = req.decoded.warehouseId;
    const hospitalDetail = await basicModel.hospital(db);
    hospitalDetail.chief = chief;
    moment.locale('th');

    const header = await model.purchasingHeader(db, porder);
    for (let i of header) {
        i.poNumber = i.purchase_order_book_number ? i.purchase_order_book_number : i.purchase_order_number;
        const arrayItems = await model.purchasingPO(db, i.purchase_order_id, warehouseId);
        arrayItems.forEach(v => {
            if (v.giveaway == 'Y') {
                v.sumcost = basicModel.comma(0.00)
            } else {
                v.sumcost = basicModel.comma(v.qty * v.unit_price)
            }
            v.total_price = basicModel.comma(v.total_price);
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

        let getAmountTransaction = await model.allAmountTransaction(db, i.budget_detail_id, +i.budget_year - 543, i.purchase_order_id);
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
    }

    res.render('po/po5', {
        hospitalDetail: hospitalDetail,
        header: header
    });
}));

export default router;