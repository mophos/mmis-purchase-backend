import Knex = require('knex');
import * as moment from 'moment';
import * as express from 'express';

export class CommitteeModel {

  public tableName = 'pc_committee';
  public primaryKey = 'committee_id';

  load(req: express.Request) {
    let data = req.body.data;
    return data;
  }

  validate(req: express.Request, res: express.Response) {
    req.check('data.committee_name', 'Invalid committee_name').notEmpty();
    req.check('data.committee_type', 'Invalid committee_type').notEmpty();
    req.check('data.datetime_start', 'Invalid committee_name').notEmpty();
    // req.check('data.datetime_end', 'Invalid datetime_end').notEmpty();
    let errors = req.validationErrors(true);
    if (errors) {
      res.status(400).send({
        msg: 'There have been validation errors: ',
        errors: errors
      });
      return false;
    }
    return true;
  }

  list(knex: Knex, limit: number = 10, offset: number = 0) {
    return knex(this.tableName)
      .orderBy('committee_id', 'desc')
      .where('is_delete', 'N')
      .limit(limit)
      .offset(offset);
  }
  getCommittee(knex: Knex, id: any) {
    return knex(this.tableName)
      .where('bid_id', id)
  }
  listbid(knex: Knex, limit: number = 10, offset: number = 0) {
    return knex('pc_committee as c')
      .select('c.*', 'b.bid_name')
      .leftJoin('l_bid_type as b', 'c.bid_id', 'b.bid_id')
      .limit(limit)
      .offset(offset);
  }
  listbidtype(knex: Knex, limit: number = 10, offset: number = 0) {
    return knex('l_bid_type as l')
      .select('l.bid_id', 'l.bid_name')
      .limit(limit)
      .offset(offset);
  }
  listActive(knex: Knex, limit: number = 10, offset: number = 0) {
    return knex(this.tableName)
      .where('committee_status', 'T')
      .orderBy('committee_id', 'desc');
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

  updateIsdelete(knex: Knex, id: string) {
    return knex(this.tableName)
      .where(this.primaryKey, id)
      .update('is_delete', 'Y');
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
  removeCommitteeBid(knex: Knex, id: string) {
    return knex('pc_committee')
      .where('bid_id', id)
      .update('bid_id', 'NULL');
  }
  updateCommitteeBid(knex: Knex, id: string, bid_id) {
    return knex('pc_committee')
      .where('committee_id', id)
      .update('bid_id', bid_id);
  }
}