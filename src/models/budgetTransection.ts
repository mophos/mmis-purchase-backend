import Knex = require('knex');
import * as moment from 'moment';
import * as express from 'express';

export class BudgetTransectionModel {

  // list(knex: Knex, limit: number = 100, offset: number = 0) {
  //   return knex('pc_budget_transection')
  //     .limit(limit)
  //     .offset(offset);
  // }

  // incomingBalance(knex: Knex, detail_id: any) {
  //   return knex('pc_budget_transection')
  //     .where('type', 'spend')
  //     .andWhere('bgdetail_id', detail_id)
  //     .limit(1)
  //     .orderBy('transection_id', 'DESC')
  // }

  // save transaction
  save(knex: Knex, datas: any) {
    return knex('pc_budget_transection')
      .insert(datas);
  }

  // update(knex: Knex, id: string, datas: any) {
  //   return knex('pc_budget_transection')
  //     .where('transection_id', id)
  //     .update(datas);
  // }

  // updateTransaction(knex: Knex, id: string) {
  //   return knex('pc_budget_transection')
  //     .where('transection_id', id)
  //     .update('type', 'revoke');
  // }

  // async detail(knex: Knex, purchaseOrderId: string) {
  //   return knex('pc_budget_transection')
  //     .where('purchase_order_id', purchaseOrderId)
  //     .where('type', 'SPEND')
  //     .orderBy('date_time', 'desc')
  //     .limit(1);
  // }

  async getDetail(knex: Knex, id: string) {
    return knex('pc_budget_transection')
      .select(knex.raw('ifnull(sum(amount), 0) as amount'))
      .where('bgdetail_id', id)
      .andWhere('transaction_status', 'SPEND')
      .limit(1);
  }

  // async budgetDetailByID(knex: Knex, id: string) {
  //   return knex('view_budget_subtype')
  //     .where('bgdetail_id', id);
  // }

  // difference(knex: Knex, pid: any) {
  //   return knex('pc_budget_transection')
  //     .where('purchase_order_id', pid)
  //     .andWhere('type', 'spend')
  //     .orderBy('date_time', 'DESC')
  //     .limit(1)
  // }

  // async summaryPoByBudgetId(knex: Knex, id: string, purchase_order_id: string) {
  //   return knex('pc_budget_transection')
  //     .sum('amount as amount')
  //     .where('bgdetail_id', id)
  //     .andWhere('type', 'spend');
  // }

  // detailActive(knex: Knex, id: string) {
  //   return knex('pc_budget_transection')
  //     .where('purchase_order_id', id)
  //     .andWhere('type', 'spend');
  // }

  // remove(knex: Knex, id: string) {
  //   return knex('pc_budget_transection')
  //     .where('purchase_order_id', id)
  //     .del();
  // }

  // getPotransaction(knex: Knex, pid: any) {
  //   return knex('pc_budget_transection as t')
  //     .select('t.date_time', 'po.purchase_order_number', 'vb.bgtype_name',
  //       'vb.bgtypesub_name', 't.incoming_balance', 't.amount', 't.difference', 't.balance', 't.type')
  //     .join('pc_purchasing_order as po', 'po.purchase_order_id', 't.purchase_order_id')
  //     .join('view_budget_subtype as vb', 'vb.bgdetail_id', 't.bgdetail_id')
  //     .where('po.purchase_order_id', pid)
  //     .orderBy('date_time', 'DESC')
  // }

  getBudgetTransaction(knex: Knex, budgetDetailId: any) {
    return knex('view_budget_subtype as vbg')
      .where('vbg.bgdetail_id', budgetDetailId)
      .limit(1);
  }

  getHistory(knex: Knex, budgetDetailId: any) {
    return knex('pc_budget_transection as pt')
      .select('pt.*', 'pc.purchase_order_number')  
      .innerJoin('pc_purchasing_order as pc', 'pc.purchase_order_id', 'pt.purchase_order_id')  
      .where('pt.bgdetail_id', budgetDetailId)
      .orderBy('pt.date_time', 'desc');
  }

  getTransactionBalance(knex: Knex, budgetDetailId: any, purchaseOrderId: any = null) {

    let query = knex('pc_budget_transection as bt')
      .select(knex.raw('sum(bt.amount) as total_purchase'))
      .where('bt.bgdetail_id', budgetDetailId)
      .where('bt.transaction_status', 'SPEND');
    
    if (purchaseOrderId) {
      query.whereNot('bt.purchase_order_id', purchaseOrderId);
    }

    return query;
  
  }

  cancelTransaction(knex: Knex, purchaseOrderId: any) {
    return knex('pc_budget_transection')
      .where('purchase_order_id', purchaseOrderId)
      .update('transaction_status', 'REVOKE');
  }
}