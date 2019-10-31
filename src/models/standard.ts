import Knex = require('knex');
import * as moment from 'moment';

export class StandardModel {

  getUnitPackages(db: Knex, genericId: any) {
    return db('mm_unit_generics as mu')
      .select('mu.standard_cost', 'mu.unit_generic_id', 'mu.from_unit_id', 'mu.to_unit_id', 'mu.qty',
        'mu.cost', 'mu.cost as old_cost', 'mu1.unit_name as from_unit_name', 'mu2.unit_name as to_unit_name')
      .innerJoin('mm_units as mu1', 'mu1.unit_id', 'mu.from_unit_id')
      .innerJoin('mm_units as mu2', 'mu2.unit_id', 'mu.to_unit_id')
      .where('mu.generic_id', genericId)
      .where('mu.is_active', 'Y')
      .where('mu.is_deleted', 'N');
  }

  getUnitPackagesPurchase(db: Knex, genericId: any, productId: any) {
    return db('mm_unit_generics as mu')
      .select('mu.standard_cost', 'mu.unit_generic_id', 'mu.from_unit_id', 'mu.to_unit_id', 'mu.qty',
        'mu.cost', 'mu.cost as old_cost', 'mu1.unit_name as from_unit_name', 'mu2.unit_name as to_unit_name',
        db.raw(`if(mp.purchase_unit_id=mu.unit_generic_id,'Y','N') as is_purchase`))
      .joinRaw(`left join mm_products as mp on mp.product_id = ?`, [productId])
      .innerJoin('mm_units as mu1', 'mu1.unit_id', 'mu.from_unit_id')
      .innerJoin('mm_units as mu2', 'mu2.unit_id', 'mu.to_unit_id')
      .where('mu.generic_id', db.raw(`?`, [genericId]))
      .where('mu.is_active', 'Y')
      .where('mu.is_deleted', 'N');
  }

  getBidTypes(db: Knex) {
    return db('l_bid_type')
      .orderBy('bid_id')
      .where('isactive', 1);
  }

  getBudgetTypes(db: Knex, warehouseId: any) {
    return db('bm_bgtype as bb')
      .select('bb.bgtype_id', 'bb.bgtype_name', 'bb.isactive')
      .join('bm_budget_detail as bbd', 'bbd.bgtype_id', 'bb.bgtype_id')
      .join('view_budget_subtype as vbs', 'bbd.bgdetail_id', 'vbs.bgdetail_id')
      .join('bm_budget_detail_warehouse as bbdw', 'bbdw.view_bgdetail_id', 'vbs.view_bgdetail_id')
      .where('bbdw.warehouse_id', warehouseId)
      .groupBy('bb.bgtype_id')
      .orderBy('bb.bgtype_name');
  }

  getBidProcess(db: Knex) {
    return db('l_bid_process')
      .where('is_active', 1)
      .orderBy('name');
  }

  getBudgetDetail(db: Knex, budgetYear: string, budgetTypeId: string, warehouseId: any) {
    return db('view_budget_subtype as vs')
      .select('vs.bgdetail_id', 'vs.view_bgdetail_id', 'vs.bg_year', 'vs.bgtype_id', 'vs.bgtype_name', 'vs.bgtypesub_id', 'vs.bgtypesub_name', 'vs.remark', 'vs.amount')
      .join('bm_budget_detail_warehouse as bbdw', 'bbdw.view_bgdetail_id', 'vs.view_bgdetail_id')
      .where('vs.bg_year', budgetYear)
      .andWhere('vs.bgtype_id', budgetTypeId)
      .andWhere('bbdw.warehouse_id', warehouseId)
  }
}