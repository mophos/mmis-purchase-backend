import Knex = require('knex');
import * as moment from 'moment';

export class HolidaysModel {

  public tableName  = 'sys_holidays';
  public primaryKey = 'id';

  findHoliday(knex: Knex,date: string) {
    return knex(this.tableName)
      .where('date', date);
  }

  listByYear(knex: Knex, year: string, limit: number = 100, offset: number = 0) {
    let mysqlYear = knex('year(holidays.`date`)');
    return knex(this.tableName)
      .whereRaw('year(holidays.`date`) = ?',[year])
      .limit(limit)
      .offset(offset);
  }

  list(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
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
      .where(this.primaryKey, id);
  }

  remove(knex: Knex, id: string) {
    return knex(this.tableName)
      .where(this.primaryKey, id)
      .del();
  }

}