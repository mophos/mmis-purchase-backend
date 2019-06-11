import Knex = require('knex');
import * as moment from 'moment';

export class PeopleModel {

  public tableName = 'um_people';
  public primaryKey = 'people_id';

  list(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex('um_people as p')
      .select('p.people_id', 'up.position_name', 't.title_name', 'p.fname', 'p.lname', knex.raw('concat(t.title_name, p.fname," ",p.lname) as  fullname'))
      .leftJoin('um_titles as t', 't.title_id', 'p.title_id')
      .joinRaw(`left join um_people_positions upp on p.people_id = upp.people_id and upp.is_actived='Y'`)
      .leftJoin('um_positions as up', 'up.position_id', 'upp.position_id')
  }

  search(knex: Knex, query = '') {
    let q = `%${query}%`;
    let sql = knex('um_people as p')
      .select('p.people_id', 'up.position_name', 't.title_name', 'p.fname', 'p.lname', knex.raw('concat(t.title_name, p.fname," ",p.lname) as  fullname'))
      .leftJoin('um_titles as t', 't.title_id', 'p.title_id')
      .joinRaw(`left join um_people_positions upp on p.people_id = upp.people_id and upp.is_actived='Y'`)
      .leftJoin('um_positions as up', 'up.position_id', 'upp.position_id')
    if (query !== '') {
      sql.where(w => {
        w.where('p.fname', 'like', q)
          .orWhere('p.lname', 'like', q)
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