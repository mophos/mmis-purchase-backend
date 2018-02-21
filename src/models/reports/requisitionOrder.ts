import { PurchasingOrderModel } from './../purchasingOrder';
import Knex = require('knex');
import * as moment from 'moment';
import * as express from 'express';

export class RequisitionOrderReportModel {

 prettyDate(date) {
    let d = date.getDate();
    const monthNames = [ "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    let m = monthNames[date.getMonth()];
    let y = date.getFullYear() + 543;
    return d+' '+m+' '+y;
  }
  hospital(knex: Knex) {
    return knex('settings as s')
  }
  requisitionItem(knex: Knex, orderId) {
    let sql = `select ppo.purchase_order_id,
    ppo.order_date,
    ml.labeler_name,
    vg.generic_name,
    ppoi.qty,
    round(ppoi.unit_price,2) AS unit,
    round(ppoi.qty*ppoi.unit_price,2) AS total_price,
    bb.bgtype_name
    FROM
    pc_purchasing_order_item ppoi
    JOIN pc_purchasing_order ppo ON ppoi.purchase_order_id = ppo.purchase_order_id
    JOIN mm_labelers ml ON ppo.labeler_id = ml.labeler_id
    JOIN view_generics vg ON vg.generic_id = ppoi.generic_id
    JOIN bm_bgtype bb ON ppo.budgettype_id=bb.bgtype_id
      where ppo.purchase_order_id = ?`;
    return knex.raw(sql,orderId);
  }
  name(knex: Knex, orderId) {
    let sql = `SELECT 
    ppo.purchase_order_id,
    up.fname,
    up.lname,
    pcp.position_name,
    us.position_name as p
    FROM
    pc_purchasing_order_item ppoi
    JOIN pc_purchasing_order ppo ON ppoi.purchase_order_id= ppo.purchase_order_id
    JOIN mm_labelers ml ON ppo.labeler_id = ml.labeler_id
    JOIN view_generics vg ON vg.generic_id = ppoi.generic_id
    JOIN bm_bgtype bb ON ppo.budgettype_id = bb.bgtype_id
    JOIN pc_committee_people pcp ON pcp.committee_id = ppo.verify_committee_id
    JOIN um_people up ON up.people_id = pcp.people_id
    JOIN um_positions us ON up.position_id=us.position_id
    WHERE ppo.purchase_order_id = ?
    GROUP BY pcp.people_id
    ORDER BY pcp.position_name DESC`;
    return knex.raw(sql,orderId);
  }
}