import Knex = require('knex');
import * as moment from 'moment';

export class BasicModel {

  getUnitPackages(knex: Knex, genericId: any) {
    return knex('mm_unit_generics as mu')
      .select('mu.unit_generic_id', 'mu.from_unit_id', 'mu.to_unit_id', 'mu.qty',
      'mu.cost', 'mu1.unit_name as from_unit_name', 'mu2.unit_name as to_unit_name')
      .innerJoin('mm_units as mu1', 'mu1.unit_id', 'mu.from_unit_id')
      .innerJoin('mm_units as mu2', 'mu2.unit_id', 'mu.to_unit_id')
      .where('mu.generic_id', genericId)
      .where('mu.is_active', 'Y')
      .where('mu.is_deleted', 'N');
  }

}