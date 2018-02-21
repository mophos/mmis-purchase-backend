import Knex = require('knex');
import * as moment from 'moment';

export class ContractModel {

  public tableName = 'cm_contract';
  public primaryKey = 'contract_ref';

  list(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .limit(limit)
      .offset(offset);
  }
  
  listGroupContactID(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .groupBy('contract_id')
      .limit(limit)
      .offset(offset);
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

  detail(knex: Knex, id: string) {
    return knex(this.tableName)
      //.innerJoin('view_contract_value','cm_contract.contract_ref','view_contract_value.contract_ref')
      .where('cm_contract.contract_ref', id);
  }

  remove(knex: Knex, id: string) {
    return knex(this.tableName)
      .where(this.primaryKey, id)
      .del();
  }

}