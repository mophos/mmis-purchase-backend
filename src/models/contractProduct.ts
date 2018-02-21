import Knex = require('knex');
import * as moment from 'moment';

export class ContractProductModel {

  list(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex('view_cm_product as p');
  }
  
  listOld(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex('cm_product as p')
      .innerJoin('cm_contract as c','p.contract_ref','c.contract_ref')
      .innerJoin('view_generics','p.product_id','view_generics.generic_id')
      .innerJoin('mm_labelers as l','c.labeler','l.labeler_id')
      .where('c.status','4')
      .orderBy('l.labeler_name','ASC')
      .limit(limit)
      .offset(offset);
  }

}