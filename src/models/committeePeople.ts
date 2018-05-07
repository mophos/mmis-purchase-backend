import Knex = require('knex');
import * as moment from 'moment';

export class CommitteePeopleModel {

  public tableName = 'pc_committee_people';
  public primaryKey = 'committee_id';

  list(knex: Knex, limit: number = 10, offset: number = 0) {
    return knex(this.tableName)
      .limit(limit)
      .offset(offset);
  }

  listWithPeopleByCommitteeI_(knex: Knex, committee_id: string, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .select('view_peoples.*', 'pc_committee_people.position_name as cp_position_name')
      .leftJoin('view_peoples', 'view_peoples.people_id', 'pc_committee_people.people_id')
      .where({ committee_id })
      .orderBy('pc_committee_people.position_name', 'DESC')
      .orderBy('pc_committee_people.position_name', 'DESC')
      .limit(limit)
      .offset(offset);
  }


  listWithPeopleByCommitteeId(knex: Knex, committee_id: string, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .select('um_people.people_id', 'pc_committee.committee_type', 'pc_committee_people.position_name as cp_position_name', 'um_positions.position_name', 'um_titles.title_name', 'fname', 'lname', knex.raw('concat(um_titles.title_name, fname," ",lname) as  fullname'))
      .innerJoin('pc_committee','pc_committee.committee_id','pc_committee_people.committee_id')
      .innerJoin('um_people', 'um_people.people_id', 'pc_committee_people.people_id')
      .leftJoin('um_titles', 'um_titles.title_id', 'um_people.title_id')
      .leftJoin('um_positions', 'um_positions.position_id', 'um_people.position_id')
      .where('pc_committee_people.committee_id', committee_id)
      .limit(limit)
      .offset(offset)
      .orderBy('pc_committee_people.position_name', 'DESC')
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
  removeByCommitteeId(knex: Knex, id: string) {
    return knex(this.tableName)
      .where({ committee_id: id })
      .del();
  }
}