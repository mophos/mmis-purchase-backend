import Knex = require('knex');
import * as moment from 'moment';
import * as express from 'express';

export class BudgetTransectionModel {

  list(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex('pc_budget_transection')
      .limit(limit)
      .offset(offset);
  }

  incomingBalance(knex: Knex, detail_id: any) {
    return knex('pc_budget_transection')
      .where('type', 'spend')
      .andWhere('bgdetail_id', detail_id)
      .limit(1)
      .orderBy('transection_id', 'DESC')
  }

  save(knex: Knex, datas: any) {
    return knex('pc_budget_transection')
      .insert(datas);
  }

  update(knex: Knex, id: string, datas: any) {
    return knex('pc_budget_transection')
      .where('transection_id', id)
      .update(datas);
  }

  updateTransaction(knex: Knex, id: string) {
    return knex('pc_budget_transection')
      .where('transection_id', id)
      .update('type', 'revoke');
  }

  async detail(knex: Knex, id: string) {
    return knex('pc_budget_transection')
      .where('purchase_order_id', id);
  }

  async getDetail(knex: Knex, id: string, year: any) {
    return knex('pc_budget_transection')
      .select(knex.raw('ifnull(sum(amount), 0) as amount'))
      .where('bgdetail_id', id)
      .andWhere('budget_year', year)
      .andWhere('type', 'spend')
      .limit(1);
  }

  async budgetDetailByID(knex: Knex, id: string) {
    return knex('view_budget_subtype')
      .where('bgdetail_id', id);
  }

  difference(knex: Knex, pid: any) {
    return knex('pc_budget_transection')
      .where('purchase_order_id', pid)
      .andWhere('type', 'spend')
      .orderBy('date_time', 'DESC')
      .limit(1)
  }

  async summaryPoByBudgetId(knex: Knex, id: string, purchase_order_id: string) {
    return knex('pc_budget_transection')
      .sum('amount as amount')
      .where('bgdetail_id', id)
      .andWhere('type', 'spend');
  }

  detailActive(knex: Knex, id: string) {
    return knex('pc_budget_transection')
      .where('purchase_order_id', id)
      .andWhere('type', 'spend');
  }

  remove(knex: Knex, id: string) {
    return knex('pc_budget_transection')
      .where('purchase_order_id', id)
      .del();
  }

  getPotransaction(knex: Knex, pid: any) {
    return knex('pc_budget_transection as t')
      .select('t.date_time', 'po.purchase_order_number', 'vb.bgtype_name',
        'vb.bgtypesub_name', 't.incoming_balance', 't.amount', 't.difference', 't.balance', 't.type')
      .join('pc_purchasing_order as po', 'po.purchase_order_id', 't.purchase_order_id')
      .join('view_budget_subtype as vb', 'vb.bgdetail_id', 't.bgdetail_id')
      .where('po.purchase_order_id', pid)
      .orderBy('date_time', 'DESC')
  }

  getBudgetTransaction(knex: Knex, budgetYear: any, budgetDetailId: any) {
    return knex('view_budget_subtype as vbg')
      .where('vbg.bgdetail_id', budgetDetailId)
      .where('vbg.bg_year', budgetYear)
      .limit(1);
    // return knex('pc_budget_transection as pbt')
    //   .select('pbt.date_time'
    //     , knex.raw(`concat(vbg.bgtype_name, ' - ', vbg.bgtypesub_name) as budget_name`)
    //     , 'po.purchase_order_number'
    //     , 'pbt.incoming_balance'
    //     , knex.raw(`IF(pbt.type='spend', pbt.amount, null) as spend_amount`)
    //     , knex.raw(`IF(pbt.type='revoke', pbt.amount, null) as revoke_amount`)
    //     , 'pbt.balance'
    //     , knex.raw(`IF(pbt.type='spend', 'ตัดงบ', 'คืนงบ') as type_desc`)
    //     , 'pbt.type')
    //   .leftJoin('pc_purchasing_order as po', 'po.purchase_order_id', 'pbt.purchase_order_id')
    //   .leftJoin('view_budget_subtype as vbg', 'vbg.bgdetail_id', 'pbt.bgdetail_id')
    //   .where('pbt.budget_year', budgetYear)
    //   .andWhere('pbt.bgdetail_id', budgetDetailId)
    //   .orderBy('date_time');
  }
}