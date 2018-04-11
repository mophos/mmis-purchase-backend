import Knex = require('knex');
import * as moment from 'moment';

export class LabelerModel {

  public tableName = 'mm_labelers';
  public primaryKey = 'labeler_id';

  autoComplete(knex: Knex, q: string = '', limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .select('mm_labelers.*', knex.raw('concat(labeler_name," ( ",short_code," )") as fullname'))
      .where('labeler_name', 'like', `%${q}%`)
      .orWhere('short_code', 'like', `%${q}%`)
      .limit(limit)
      .offset(offset);
  }

  list(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)

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
      .where(this.primaryKey, id);
  }

  remove(knex: Knex, id: string) {
    return knex(this.tableName)
      .where(this.primaryKey, id)
      .del();
  }

}