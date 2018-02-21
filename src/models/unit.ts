import Knex = require('knex');
import * as moment from 'moment';

export class UnitModel {

  public tableName  = 'view_mm_unit_products';

  list(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .limit(limit)
      .offset(offset);
  }

  byProduct(knex: Knex,id: string, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .where('product_id',id)
      .limit(limit)
      .offset(offset);
  }

  byGeneric(knex: Knex,id: string, limit: number = 100, offset: number = 0) {
    return knex('mm_unit_generics as ug')
      .select(
        'ug.*',
        'ufrom.unit_name as unitname_from',
        'uto.unit_name as unitname_to',
      )
      .innerJoin('mm_units as ufrom','ufrom.unit_id','ug.from_unit_id')
      .innerJoin('mm_units as uto','uto.unit_id','ug.to_unit_id')
      .where('ug.generic_id',id)
      .limit(limit)
      .offset(offset);
  }

  detail(knex: Knex, id: string) {
    return knex(this.tableName)
      .where('unit_conversion_id', id);
  }

}