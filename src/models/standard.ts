import Knex = require('knex');
import * as moment from 'moment';

export class StandardModel {

  getUnitPackages(db: Knex, genericId: any) {
    return db('mm_unit_generics as mu')
      .select('mu.standard_cost','mu.unit_generic_id', 'mu.from_unit_id', 'mu.to_unit_id', 'mu.qty',
        'mu.cost', 'mu.cost as old_cost', 'mu1.unit_name as from_unit_name', 'mu2.unit_name as to_unit_name')
      .innerJoin('mm_units as mu1', 'mu1.unit_id', 'mu.from_unit_id')
      .innerJoin('mm_units as mu2', 'mu2.unit_id', 'mu.to_unit_id')
      .where('mu.generic_id', genericId)
      .where('mu.is_active', 'Y')
      .where('mu.is_deleted', 'N');
  }

  getBidTypes(db: Knex) {
    return db('l_bid_type')
      .orderBy('bid_id');
  }

  getBudgetTypes(db: Knex) {
    return db('bm_bgtype')
      .orderBy('bgtype_name');
  }

  getBidProcess(db: Knex) {
    return db('l_bid_process')
      .where('is_active', 1)
      .orderBy('name');
  }

  getBudgetDetail(db: Knex, budgetYear: string, budgetTypeId: string) {
    return db('view_budget_subtype as vs')
      .where('vs.bg_year', budgetYear)
      .andWhere('vs.bgtype_id', budgetTypeId);
  }
}