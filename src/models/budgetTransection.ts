import Knex = require('knex');
import * as moment from 'moment';
import * as express from 'express';

export class BudgetTransectionModel {

  getCurrentAmount(db: Knex, purchaseOrderId: any, budgetDetailId: any) {
    let sql = db('pc_budget_transection as pt')
      .select('pt.*', 'v.bgtype_name', 'v.bgtypesub_name')
      .join('view_budget_subtype as v', 'v.view_bgdetail_id', 'pt.view_bgdetail_id')
      .join('pc_purchasing_order as po', 'po.purchase_order_id', 'pt.purchase_order_id')
      .where('pt.purchase_order_id', purchaseOrderId)
      .where('pt.view_bgdetail_id', budgetDetailId)
      .whereRaw(`IF
      ( po.is_cancel = 'N',  pt.transaction_status = 'SPEND',  pt.transaction_status = 'REVOKE' or pt.transaction_status = 'SPEND'  )`)
      .limit(1);
    console.log(sql.toString());
    return sql;

  }

  // save transaction
  // saveLog(knex: Knex, datas: any) {
  //   return knex('pc_budget_transection_log')
  //     .insert(datas);
  // }

  save(knex: Knex, datas: any) {
    return knex('pc_budget_transection')
      .insert(datas);
  }

  update(knex: Knex, datas: any, transectionId) {
    return knex('pc_budget_transection')
      .update(datas)
      .where('transection_id', transectionId);
  }


  // async getDetail(knex: Knex, id: string) {
  //   return knex('pc_budget_transection_log')
  //     .select(knex.raw('ifnull(sum(amount), 0) as amount'))
  //     .where('bgdetail_id', id)
  //     .andWhere('transaction_status', 'SPEND')
  //     .limit(1);
  // }

  getBudgetTransaction(knex: Knex, budgetDetailId: any) {
    return knex('view_budget_subtype as vbg')
      .where('vbg.view_bgdetail_id', budgetDetailId)
      .limit(1);
  }

  getHistory(knex: Knex, budgetDetailId: any) {
    return knex('pc_budget_transection_log as pt')
      .select('pt.*', 'pc.purchase_order_number')
      .innerJoin('pc_purchasing_order as pc', 'pc.purchase_order_id', 'pt.purchase_order_id')
      .where('pt.view_bgdetail_id', budgetDetailId)
      .orderBy('pt.transection_id', 'desc');
  }

  getTransactionBalance(knex: Knex, budgetDetailId: any, purchaseOrderId: any = null, transectionId: any = null) {
    let query = knex('pc_budget_transection as bt')
      .select(knex.raw('sum(bt.amount) as total_purchase'))
      .where('bt.view_bgdetail_id', budgetDetailId)
      .where('bt.transaction_status', 'SPEND');

    // if (purchaseOrderId) {
    //   query.where('')
    //   query.whereNot('bt.purchase_order_id', purchaseOrderId);
    // }
    if (transectionId) {
      query.where('bt.transection_id', '<', transectionId)
    }

    return query;

  }

  // cancelTransactionLog(knex: Knex, purchaseOrderId: any) {
  //   return knex('pc_budget_transection_log')
  //     .where('purchase_order_id', purchaseOrderId)
  //     .update('transaction_status', 'REVOKE');
  // }

  cancelTransaction(knex: Knex, purchaseOrderId: any) {
    return knex('pc_budget_transection')
      .where('purchase_order_id', purchaseOrderId)
      .update('transaction_status', 'REVOKE');
  }

  getTransaction(db: Knex, transectionId: any, viewBudgetDetailId: any) {
    return db('pc_budget_transection')
      .whereIn('transaction_status', ['SPEND', 'ADDED'])
      .where('view_bgdetail_id', viewBudgetDetailId)
      .where('transection_id', '>=', transectionId)
      .orderBy('transection_id')
  }

  getlastTransactionWithPo(db: Knex, purchaseOrderId: any) {
    return db('pc_budget_transection')
      .where('transaction_status', 'REVOKE')
      .whereIn('purchase_order_id', purchaseOrderId)
      .limit(1)
  }

  getBalance(db: Knex, budgetDetailId: any) {
    return db('pc_budget_transection as p')
      .select('p.*', 'v.bgtype_name', 'v.bgtypesub_name')
      .join('view_budget_subtype as v', 'v.view_bgdetail_id', 'p.view_bgdetail_id')
      .where('p.transaction_status', 'SPEND')
      .where('p.view_bgdetail_id', budgetDetailId)
      .orderBy('p.transection_id', 'DESC')
      .limit(1)
  }
}