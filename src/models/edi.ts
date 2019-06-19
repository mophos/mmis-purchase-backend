import Knex = require('knex');
import * as moment from 'moment';
const request = require("request");
export class EdiModel {


  getSetting(knex: Knex, actionName: any) {
    return knex('pc_edi')
  }

  saveSetting(knex: Knex, value: any) {
    let sqls = [];
    value.forEach(v => {
      let sql = `
          UPDATE pc_edi set value='${v.value}'
          where action_name='${v.action_name}'`;
      sqls.push(sql);
    });
    let queries = sqls.join(';');
    return knex.raw(queries);
  }

  sendEDI(data: any) {
    return new Promise((resolve: any, reject: any) => {
      var options = {
        method: 'POST',
        url: 'http://ananddrs.net/edi2018/api/purchase/create.php',
        agentOptions: {
          rejectUnauthorized: false
        },
        headers:
        {
          'postman-token': 'c63b4187-f395-a969-dd57-19018273670b',
          'cache-control': 'no-cache',
          'content-type': 'application/json'
        },
        body: data,
        json: true
      };

      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }

  async getHeaderEDI(knex: Knex, purchaOrderId) {
    const sql = `select 
    po.purchase_order_id,
    po.purchase_order_number,
    po.purchase_order_book_number,
    if(po.contract_id is null,0,1) as po_type,
    po.contract_ref,
    po.order_date,
    wh.warehouse_name,
    po.budget_detail_id,
    po.total_price,
    concat(up.fname,' ',up.lname) as buyer_name,
    (select count(*) from pc_purchasing_order_item where purchase_order_id = po.purchase_order_id) as total_records,
    ml.labeler_code,
		ml.labeler_name,
		ml.labeler_name_po,
		ml.labeler_code_edi
     from pc_purchasing_order as po
     join um_people_users as upu on po.people_user_id = upu.people_user_id
     join um_people as up on up.people_id = upu.people_id
     join wm_warehouses as wh on wh.warehouse_id = po.warehouse_id
     join mm_labelers ml on ml.labeler_id = po.labeler_id
     where po.purchase_order_id = ${purchaOrderId}`;
    return knex.raw(sql);
  }

  async getDetailEDI(knex: Knex, purchaOrderId) {
    const sql = `
    select 
    mp.working_code,
    mp.product_name,
    mu1.unit_name as large_unit,
    mu2.unit_name as small_unit,
    mug.qty as conversion_qty,
    poi.*,
    mp.edi_labeler_code
    from pc_purchasing_order_item as poi
    join mm_products as mp on poi.product_id = mp.product_id
    join mm_unit_generics as mug on poi.unit_generic_id = mug.unit_generic_id
    join mm_units as mu1 on mu1.unit_id = mug.from_unit_id
    join mm_units as mu2 on mu2.unit_id = mug.to_unit_id

     where poi.purchase_order_id = ${purchaOrderId}`;
    return knex.raw(sql);
  }
}