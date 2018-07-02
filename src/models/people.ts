import Knex = require('knex');
import * as moment from 'moment';

export class PeopleModel {

  public tableName = 'um_people';
  public primaryKey = 'people_id';

  list(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex('um_people')
      .select('people_id', 'um_positions.position_name', 'um_titles.title_name', 'fname', 'lname', knex.raw('concat(um_titles.title_name, fname," ",lname) as  fullname'))
      .leftJoin('um_titles', 'um_titles.title_id', 'um_people.title_id')
      .leftJoin('um_positions', 'um_positions.position_id', 'um_people.position_id')
    // .limit(limit)
    // .offset(offset)
  }

  search(knex: Knex, query = '') {
    let q = `%${query}%`;
    let sql = knex('um_people')
      .select('people_id', 'um_positions.position_name', 'um_titles.title_name', 'fname', 'lname', knex.raw('concat(um_titles.title_name, fname," ",lname) as  fullname'))
      .leftJoin('um_titles', 'um_titles.title_id', 'um_people.title_id')
      .leftJoin('um_positions', 'um_positions.position_id', 'um_people.position_id')
    if (query !== '') {
      sql.where(w => {
        w.where('fname', 'like', q)
          .orWhere('lname', 'like', q)
      })
    }
    return sql;
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