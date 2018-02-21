import Knex = require('knex');
import * as moment from 'moment';

export class BudgetTypeModel {

  public tableName = 'bm_bgtype';
  public primaryKey = 'bgtype_id';

  allactive(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex.raw(`
SELECT
              bm_bgtype.bgtype_id,
              bm_bgtype.bgtype_name,
              bm_bgkind.bgkind_name
            FROM
              bm_bgtype
            INNER JOIN bm_bgkind on bm_bgkind.bgkind_id = bm_bgtype.bgkind_id
            WHERE
              bm_bgtype.bgkind_id = 1
            UNION 
            SELECT
              bm_bgtype.bgtype_id,
              bm_bgtype.bgtype_name,
              bm_bgkind.bgkind_name
            FROM
              bm_bgtype
            INNER JOIN bm_bgkind on bm_bgkind.bgkind_id = bm_bgtype.bgkind_id
            INNER JOIN bm_bgtype_people on bm_bgtype.bgtype_id = bm_bgtype_people.bgtype_id
            WHERE
              bm_bgtype.bgkind_id = 2 AND
              bm_bgtype_people.\`status\` = 1 AND
              NOW() BETWEEN  bm_bgtype_people.start_date AND bm_bgtype_people.exp_date
    `);
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
    return knex('view_budget')
      .where(this.primaryKey, id);
  }

  remove(knex: Knex, id: string) {
    return knex(this.tableName)
      .where(this.primaryKey, id)
      .del();
  }

}