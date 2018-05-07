import Knex = require('knex');
import * as moment from 'moment';
import * as express from 'express';
import { log } from 'util';

export class PurchasingOrderModel {

  public tableName = 'pc_purchasing_order';
  public primaryKey = 'purchase_order_id';

  load(req: express.Request) {
    let data = req.body.data;
    return data;
  }

  validate(req: express.Request, res: express.Response) {
    req.check('data.po_id', 'Invalid po_id').notEmpty();
    req.check('data.purchasing_id', 'Invalid purchasing_id').notEmpty();
    req.check('data.contract_id', 'Invalid contract_id').notEmpty();
    req.check('data.total_price', 'Invalid total_price').notEmpty();
    req.check('data.created_date', 'Invalid created_date').notEmpty();
    req.check('data.updated_date', 'Invalid updated_date').notEmpty();
    let errors = req.validationErrors(true);
    if (errors) {
      res.status(400).send({
        msg: 'There have been validation errors: ',
        errors: errors
      });
      return false;
    }
    return true;
  }

  checkApprove(knex: Knex, username: any, password: any, action: any) {
    return knex('sys_approve as sa')
      .leftJoin('um_users as uu', 'uu.user_id', 'sa.user_id')
      .where('sa.action_name', action)
      .andWhere('uu.username', username)
      .andWhere('sa.password', password)
  }

  getLastOrderByLabeler(knex: Knex, labeler_id: string) {
    return knex('pc_purchasing_order as p')
      .where('p.labeler_id', labeler_id)
      .where('p.purchase_order_status', 'APPROVED')
      .orderBy('p.order_date', 'desc')
      .orderBy('p.purchase_order_number', 'desc')
      .limit(1)
  }

  getBudgetDetail(knex: Knex, budgetYear: string, budget_type_id: string) {
    return knex('view_budget_subtype as vs')
      .where('vs.bg_year', budgetYear)
      .andWhere('vs.bgtype_id', budget_type_id);
  }

  officerId(knex: Knex, id: any) {
    return knex('um_people as p')
      .leftJoin('um_positions as pp', 'pp.position_id', 'p.position_id')
      .where('p.people_id', id);
  }

  officers(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex('um_purchasing_officer')
      .select(knex.raw('concat(um_titles.title_name, um_people.fname," ",um_people.lname) as  fullname'), 'um_positions.position_name', 'um_purchasing_officer.*', 'um_purchasing_officer_type.type_name')
      .leftJoin('um_people', 'um_people.people_id', 'um_purchasing_officer.people_id')
      .leftJoin('um_positions', 'um_positions.position_id', 'um_people.position_id')
      .leftJoin('um_titles', 'um_titles.title_id', 'um_people.title_id')
      .leftJoin('um_purchasing_officer_type', 'um_purchasing_officer_type.type_id', 'um_purchasing_officer.type_id')
      .orderBy('um_purchasing_officer.type_id', 'ASC');
  }

  officersByTypeId(knex: Knex, id: number, limit: number = 100, offset: number = 0) {
    return knex('um_purchasing_officer')
      .select(knex.raw('concat(um_titles.title_name, um_people.fname," ",um_people.lname) as  fullname'), 'um_positions.position_name', 'um_purchasing_officer.*', 'um_purchasing_officer_type.type_name')
      .innerJoin('um_people', 'um_people.people_id', 'um_purchasing_officer.people_id')
      .innerJoin('um_titles', 'um_titles.title_id', 'um_people.title_id')
      .leftJoin('um_positions', 'um_positions.position_id', 'um_people.position_id')
      .innerJoin('um_purchasing_officer_type', 'um_purchasing_officer_type.type_id', 'um_purchasing_officer.type_id')
      .where('um_purchasing_officer.type_id', id)
      .orderBy('um_purchasing_officer.type_id', 'ASC');
  }

  list(knex: Knex, limit: number = 100, offset: number = 0) {

    let sumItems = knex
      .count('po.purchase_order_id')
      .from('pc_purchasing_order_item as po')
      .whereRaw('po.purchase_order_id = pc_purchasing_order.purchase_order_id')
      .groupBy('po.purchase_order_id').as('puchase_order_count')

    return knex(this.tableName)
      .select(sumItems, 'pc_purchasing_order.*', 'l.labeler_name', 'bp.name as bid_process_name')
      .innerJoin('mm_labelers as l', 'pc_purchasing_order.labeler_id', 'l.labeler_id')
      .innerJoin('cm_bid_process as bp', 'pc_purchasing_order.purchase_method', 'bp.id')
      .orderBy('pc_purchasing_order.order_date', 'DESC');
  }

  getOrderList(knex: Knex, bgSubType: any) {
    return knex('pc_purchasing_order as po')
      .select('*', knex.raw('ROUND( SUM(poi.total_price), 2 ) as total_price'))
      .join('pc_purchasing_order_item as poi', 'po.purchase_order_id', 'poi.purchase_order_id')
      .where('po.is_cancel', 'N')
      .andWhere('po.budget_detail_id', bgSubType)
      .groupBy('po.purchase_order_id')
      .orderBy('po.purchase_order_number')
  }

  listByStatus(
    knex: Knex, status: Array<any>,
    contract: string = 'ALL', query: string = '',
    start_date: string = '', end_date: string = '',
    limit: number = 20, offset: number = 0,
    genericTypeIds: any[]) {
    let sumItems = knex
      .select(knex.raw('sum(po.unit_price*po.qty)'))
      .from('pc_purchasing_order_item as po')
      .whereRaw('po.purchase_order_id = pc_purchasing_order.purchase_order_id')
      .where('po.giveaway', 'N')
      .groupBy('po.purchase_order_id').as('puchase_money_total');

    let sumReceive = knex
      .count('r.purchase_order_id')
      .from('wm_receives as r')
      .whereRaw('r.purchase_order_id = pc_purchasing_order.purchase_order_id')
      .as('recieve_count');


    let con = knex(this.tableName)
      .select(sumItems, sumReceive, 'pc_purchasing_order.*', 'l.labeler_name',
        'bp.name as bid_process_name', 'bgs.bgtypesub_name', 'cm.contract_no')
      .leftJoin('mm_labelers as l', 'pc_purchasing_order.labeler_id', 'l.labeler_id')
      .leftJoin('l_bid_process as bp', 'pc_purchasing_order.purchase_method_id', 'bp.id')
      .leftJoin('bm_budget_detail as bgd', 'bgd.bgdetail_id', 'pc_purchasing_order.budget_detail_id')
      .leftJoin('bm_bgtypesub as bgs', 'bgs.bgtypesub_id', 'bgd.bgtypesub_id')
      .leftJoin('cm_contracts as cm', 'cm.contract_id', 'pc_purchasing_order.contract_id')
      .whereIn('pc_purchasing_order.purchase_order_status', status)
      .whereIn('pc_purchasing_order.generic_type_id', genericTypeIds)
      .orderBy('pc_purchasing_order.order_date', 'DESC')
      .orderBy('pc_purchasing_order.purchase_order_number', 'DESC');

    if (contract === 'Y') {
      con.where('pc_purchasing_order.is_contract', 'Y');
    } else if (contract === 'N') {
      con.where('pc_purchasing_order.is_contract', 'N');
    }

    if (query !== '') {
      con.where(w => {
        w.where('pc_purchasing_order.purchase_order_number', 'like', `%${query}%`)
          .orWhere('pc_purchasing_order.purchase_order_book_number', 'like', `%${query}%`)
      });
    }

    if (start_date !== '' && end_date !== '') {
      con.whereBetween('pc_purchasing_order.order_date', [start_date, end_date]);
    }

    con.limit(limit)
      .offset(offset);

    return con;
  }

  listByStatusTotal(
    knex: Knex, status: Array<any>,
    contract: string = 'ALL', query: string = '',
    start_date: string = '', end_date: string = '',
    genericTypeIds: any[]) {

    let con = knex(this.tableName)
      .select(knex.raw('count(*) as total'))
      // .leftJoin('mm_labelers as l', 'pc_purchasing_order.labeler_id', 'l.labeler_id')
      // .leftJoin('l_bid_process as bp', 'pc_purchasing_order.purchase_method_id', 'bp.id')
      .whereIn('pc_purchasing_order.purchase_order_status', status)
      .whereIn('pc_purchasing_order.generic_type_id', genericTypeIds)
    // .orderBy('pc_purchasing_order.order_date', 'DESC')
    // .orderBy('pc_purchasing_order.purchase_order_number', 'DESC');

    if (contract === 'Y') {
      con.where('pc_purchasing_order.is_contract', 'Y');
    } else if (contract === 'N') {
      con.where('pc_purchasing_order.is_contract', 'N');
    }

    if (query !== '') {
      con.where(w => {
        w.where('pc_purchasing_order.purchase_order_number', 'like', `%${query}%`)
          .orWhere('pc_purchasing_order.purchase_order_book_number', 'like', `%${query}%`)
      });
    }

    if (start_date !== '' && end_date !== '') {
      con.whereBetween('pc_purchasing_order.order_date', [start_date, end_date]);
    }

    return con;
  }

  // isCancel(knex: Knex, limit: number = 100, offset: number = 0, genericTypeIds: any[]) {
  //   let sumItems = knex
  //     .count('po.purchase_order_id')
  //     .from('pc_purchasing_order_item as po')
  //     .whereRaw('po.purchase_order_id = pc_purchasing_order.purchase_order_id')
  //     .groupBy('po.purchase_order_id').as('puchase_order_count')
  //   return knex(this.tableName)
  //     .select(sumItems, 'pc_purchasing_order.*', 'l.labeler_name', 'bp.name as bid_process_name')
  //     .innerJoin('mm_labelers as l', 'pc_purchasing_order.labeler_id', 'l.labeler_id')
  //     .innerJoin('cm_bid_process as bp', 'pc_purchasing_order.purchase_method', 'bp.id')
  //     .where('pc_purchasing_order.is_cancel', '1')
  //     .whereIn('generic_type_id', genericTypeIds)
  //     .orderBy('purchase_order_id', 'DESC');
  // }

  listContracts(knex: Knex, limit: number = 100, offset: number = 0) {

    let sumItems = knex
      .count('po.purchase_order_id')
      .from('pc_purchasing_order_item as po')
      .whereRaw('po.purchase_order_id = poi.purchase_order_id')
      .groupBy('po.purchase_order_id').as('puchase_order_count')

    return knex(`${this.tableName} as poi`)
      .select(sumItems, 'p.*', 'poi.*', 'l.labeler_name', 'c.project_id', 'cm.committee_name')
      .innerJoin('pc_purchasing as p', 'poi.purchasing_id', 'p.purchasing_id')
      .innerJoin('cm_contract as c', 'poi.contract_ref', 'c.contract_ref')
      .leftJoin('mm_labelers as l', 'poi.labeler_id', 'l.labeler_id')
      .leftJoin('pc_committee as cm', 'poi.verify_committee_id', 'cm.committee_id')
      .where('poi.is_contract', 'Y')
      .orderBy('poi.purchasing_id', 'DESC');
  }

  listNoContracts(knex: Knex, limit: number = 100, offset: number = 0) {
    let sumItems = knex
      .count('po.purchase_order_id')
      .from('pc_purchasing_order_item as po')
      .whereRaw('po.purchase_order_id = poi.purchase_order_id')
      .groupBy('po.purchase_order_id').as('puchase_order_count');

    return knex(`${this.tableName} as poi`)
      .select(sumItems, 'poi.*', 'lb.labeler_name', 'p.*')
      .innerJoin('pc_purchasing as p', 'poi.purchasing_id', 'p.purchasing_id')
      .leftJoin('mm_labelers as lb', 'poi.labeler_id', 'lb.labeler_id')
      .where('poi.is_contract', 'N')
      .orderBy('poi.purchasing_id', 'DESC');
  }

  listNoContractsByRequisitionID(knex: Knex, requisitionID: string, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .innerJoin('pc_purchasing', 'pc_purchasing_order.purchasing_id', 'pc_purchasing.purchasing_id')
      .leftJoin('mm_labelers', 'pc_purchasing_order.labeler_id', 'mm_labelers.labeler_id')
      .where('pc_purchasing_order.is_contract', 'N')
      .where('pc_purchasing_order.requisition_id', requisitionID);
  }

  purchaseOrderContract(knex: Knex, status: string = null, limit: number = 100, offset: number = 0) {
    let statusItems = ['PREPARED', 'CONFIRMED', 'CANCELLED'];
    return knex('pc_purchasing_order')
      .innerJoin('pc_purchasing', 'pc_purchasing_order.purchasing_id', 'pc_purchasing.purchasing_id')
      .innerJoin('mm_labelers', 'pc_purchasing_order.labeler_id', 'mm_labelers.labeler_id')
      .leftJoin('pc_committee', 'pc_purchasing_order.verify_committee_id', 'pc_committee.committee_id')
      .where('pc_purchasing_order.is_contract', 'Y')
      .where('pc_purchasing.purchasing_status', status);
  }

  purchaseOrderNoContract(knex: Knex) {
    return knex.raw(`
        SELECT
          pc.purchasing_id,
          pc.purchasing_name,
          pc.datetime_create,
          pc.purchasing_status,
          pc.prepare_date,
          pc.project_name,
          pc.project_id,
          pc.project_control_id,
          pc.verify_committee_id,
          c.committee_name,

          po.purchase_order_id,
          po.purchase_order_number,
          po.egp_id,
          po.order_date,
          po.contract_ref,
          po.contract_id,
          po.total_price,
          po.is_contract,
          po.commitee_check_id,
          po.commitee_check_item,
          po.user_id
        FROM
          pc_purchasing_order po
        INNER JOIN pc_purchasing pc ON pc.purchasing_id = po.purchasing_id
        LEFT JOIN pc_committee c on c.committee_id = pc.verify_committee_id        
        WHERE po.is_contract = 'N'
         ORDER BY pc.purchasing_id DESC
    `);
  }

  save(knex: Knex, datas: any) {
    return knex(this.tableName)
      .insert(datas);
  }

  update(knex: Knex, id: string, datas: any) {
    return knex(this.tableName)
      .where(this.primaryKey, id)
      .update(datas);
  }

  updateStatusLog(knex: Knex, data: any) {
    return knex('pc_status_logs')
      .insert(data);
  }

  createPoNumber(knex: Knex, id: string, datas: any) {
    return knex(this.tableName)
      .where(this.primaryKey, id)
      .update(datas);
  }

  detail(knex: Knex, id: string) {
    return knex(this.tableName)
      .select('pc_purchasing_order.*', 'mm_labelers.labeler_name', 'bgd.bgtypesub_id', 'cm.contract_no')
      .innerJoin('mm_labelers', 'mm_labelers.labeler_id', 'pc_purchasing_order.labeler_id')
      .leftJoin('bm_budget_detail as bgd', 'bgd.bgdetail_id', 'pc_purchasing_order.budget_detail_id')
      .leftJoin('cm_contracts as cm', 'cm.contract_id', 'pc_purchasing_order.contract_id')
      .where(this.primaryKey, id);
  }

  remove(knex: Knex, id: string) {
    return knex(this.tableName)
      .where(this.primaryKey, id)
      .del();
  }
  getPurchaseCheckHoliday(knex: Knex, date) {
    return knex('sys_holidays').where('date', date);
  }
  getPOid(knex: Knex, sId: string, eId: string, genericTypeId: string, orderStatus: string) {
    let sql = `SELECT
    pp.purchase_order_id,
    pp.purchase_order_number AS po_id,
    pp.purchase_order_status,
    mg.generic_type_id 
  FROM
    pc_purchasing_order AS pp
    JOIN mm_generic_types AS mg ON pp.generic_type_id = mg.generic_type_id 
  WHERE
    pp.purchase_order_number BETWEEN '${sId}' AND '${eId}' 
    AND pp.generic_type_id = ${genericTypeId}`
    if (orderStatus !== 'ALL') {
      sql += ` AND pp.purchase_order_status = ${orderStatus}`
    }
    console.log('000000000000000', sql);
    return (knex.raw(sql))
  }

  getReceives(knex: Knex, purchaseOrderId: any) {
    let sql = `
    select r.receive_id, r.receive_date, r.receive_code, r.delivery_code, r.delivery_date,
    r.vendor_labeler_id, l.labeler_name, (select count(*) from wm_receive_detail as wd where wd.receive_id=r.receive_id group by wd.receive_id) as total_items, (select sum(wd.receive_qty*wd.cost) from wm_receive_detail as wd where wd.receive_id=r.receive_id group by wd.receive_id) as total_cost
    from wm_receives as r
    inner join mm_labelers as l on l.labeler_id=r.vendor_labeler_id

    where r.purchase_order_id=?
    `;

    return knex.raw(sql, [purchaseOrderId]);
  }

  getReceiveItems(knex: Knex, receiveId: any) {
    let sql = `
      select rd.*, mp.product_name, uf.unit_name as from_unit_name, ut.unit_name as to_unit_name, ug.qty as conversion_qty
      from wm_receive_detail as rd 
      inner join mm_products as mp on mp.product_id=rd.product_id
      inner join mm_unit_generics as ug on ug.unit_generic_id=rd.unit_generic_id
      inner join mm_units as uf on uf.unit_id=ug.from_unit_id
      inner join mm_units as ut on ut.unit_id=ug.to_unit_id
      where rd.receive_id=?
      order by mp.product_name
    `;

    return knex.raw(sql, [receiveId]);
  }
  getGenericTypes(knex: Knex) {
    return knex('mm_generic_types');
  }
  getPrintDate(knex: Knex, start_date: string, end_date: string, genericTypeId: string, orderStatus: string) {
    let sql = `SELECT
    pp.purchase_order_id,
    pp.purchase_order_number AS po_id,
    pp.purchase_order_status,
    mg.generic_type_id 
  FROM
    pc_purchasing_order AS pp
    JOIN mm_generic_types AS mg ON pp.generic_type_id = mg.generic_type_id 
  WHERE
    pp.order_date BETWEEN '${start_date}' AND '${end_date}' 
    AND pp.generic_type_id = ${genericTypeId}`
    if (orderStatus !== 'ALL') {
      sql += ` AND pp.purchase_order_status = ${orderStatus}`
    }
    return (knex.raw(sql))
  }
  getPeriodStatus(knex: Knex, month, year) {
    return knex.select('*').from('wm_period').where('budget_year', year).where('period_month', month)
  }

  getGeneric(knex: Knex, generic_type_id: any, limit: any, offset: any) {
    let sql = `SELECT
    po.purchase_order_number,
    mg.generic_id,
    mg.generic_name,
    mg.working_code AS generic_code
  FROM
    mm_generics AS mg
  JOIN pc_purchasing_order_item AS pp ON mg.generic_id = pp.generic_id
  JOIN pc_purchasing_order AS po ON pp.purchase_order_id = po.purchase_order_id
  WHERE
    mg.generic_type_id IN (${generic_type_id})
  GROUP BY mg.generic_id
  limit ${limit}
  offset ${offset}`
    return (knex.raw(sql))
  }

  getGenericSearch(knex: Knex, generic_type_id: any, limit: any, offset: any, query) {
    let _query = `%${query}%`;
    let sql = `SELECT
    po.purchase_order_number,
    mg.generic_id,
    mg.generic_name,
    mg.working_code AS generic_code
  FROM
    mm_generics AS mg
  JOIN pc_purchasing_order_item AS pp ON mg.generic_id = pp.generic_id
  JOIN pc_purchasing_order AS po ON pp.purchase_order_id = po.purchase_order_id
  WHERE
    mg.generic_type_id IN (${generic_type_id}) and
    (
      mg.generic_id = '${query}' or
      mg.generic_name like '${_query}'
    )
  GROUP BY mg.generic_id
  limit ${limit}
  offset ${offset}`
    return (knex.raw(sql))
  }

  getGenericTotal(knex: Knex, generic_type_id: any) {
    let sql = `
    select count(a.generic_id) as total from (
      select mg.generic_id
        FROM
          mm_generics AS mg
        JOIN pc_purchasing_order_item AS pp ON mg.generic_id = pp.generic_id
        JOIN pc_purchasing_order AS po ON pp.purchase_order_id = po.purchase_order_id
        WHERE
          mg.generic_type_id IN (${generic_type_id})
        GROUP BY mg.generic_id
      ) as a`
    return (knex.raw(sql))
  }

  getGenericTotalSearch(knex: Knex, generic_type_id: any, query) {
    let _query = `%${query}%`;
    let sql = `
    select count(a.generic_id) as total from (
      select mg.generic_id
        FROM
          mm_generics AS mg
        JOIN pc_purchasing_order_item AS pp ON mg.generic_id = pp.generic_id
        JOIN pc_purchasing_order AS po ON pp.purchase_order_id = po.purchase_order_id
        WHERE
          mg.generic_type_id IN (${generic_type_id}) and
          (
            mg.generic_id = '${query}' or
            mg.generic_name like '${_query}'
          )
        GROUP BY mg.generic_id
      ) as a`
    return (knex.raw(sql))
  }

  getProductHistory(knex: Knex, generic_id: string) {
    let sql = `SELECT
    po.purchase_order_number,
    mp.working_code AS trading_code,
    mp.product_name,
		ml.labeler_name,
    pp.qty,
    mu.unit_name AS large_unit_name,
    mug.qty AS conversion_qty,
    mmu.unit_name AS small_large_unit_name,
    pp.unit_price,
    pp.total_price,
    po.contract_id
  FROM
    mm_generics AS mg
  JOIN pc_purchasing_order_item AS pp ON mg.generic_id = pp.generic_id
  JOIN pc_purchasing_order AS po ON pp.purchase_order_id = po.purchase_order_id
  JOIN mm_products AS mp ON pp.product_id = mp.product_id
	LEFT JOIN mm_labelers as ml on ml.labeler_id = mp.v_labeler_id 
  JOIN mm_unit_generics AS mug ON pp.unit_generic_id = mug.unit_generic_id
  JOIN mm_units AS mu ON mug.from_unit_id = mu.unit_id
  JOIN mm_units AS mmu ON mug.to_unit_id = mmu.unit_id
  WHERE
    pp.generic_id = '${generic_id}'
  AND
    pp.giveaway = 'N'
    `
    return (knex.raw(sql))
  }

  searchGenericHistory(knex: Knex, key: string) {
    let _key = '%' + key + '%'
    let sql = `SELECT
    po.purchase_order_number,
    mg.generic_id,
    mg.generic_name,
    mg.working_code AS generic_code,
    mp.product_name
  FROM
    mm_generics AS mg
  JOIN pc_purchasing_order_item AS pp ON mg.generic_id = pp.generic_id
  JOIN pc_purchasing_order AS po ON pp.purchase_order_id = po.purchase_order_id
  JOIN mm_products AS mp ON pp.product_id = mp.product_id
  WHERE
    (
      mg.working_code = '${key}'
      OR mp.product_name like '${_key}'
      OR mg.generic_id = '${key}'
      OR mg.generic_name like'${_key}'
    )
  GROUP BY
    mg.generic_id`
    return (knex.raw(sql))
  }

  changePurchaseDate(db: Knex, purchaseIds: any[], purchaseDate: any) {
    return db('pc_purchasing_order')
      .update('order_date', purchaseDate)
      .whereIn('purchase_order_id', purchaseIds);
  }

  getSysReport(db: Knex) {
    return db('um_report')
      .where('is_active', 'Y')
  }

  getBookNumber(db: Knex) {
    return db('pc_purchasing_order')
      .select('purchase_order_book_number')
      .whereNot('purchase_order_book_number', null)
  }

}