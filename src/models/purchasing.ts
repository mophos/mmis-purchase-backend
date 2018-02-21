import Knex = require('knex');
import * as moment from 'moment';
import * as express from 'express';

export class PurchasingModel {

  public tableName = 'pc_purchasing';
  public primaryKey = 'purchasing_id';

  load(req: express.Request) {
      let data = req.body.data;
      return data;
  }
  
  validate(req: express.Request, res: express.Response) {
    req.check('data.purchasing_id', 'Invalid purchasing_id').notEmpty();
    req.check('data.purchasing_name', 'Invalid purchasing_name').notEmpty();
    req.check('data.is_contract', 'Invalid is_contract').notEmpty();
    req.check('data.purchasing_status', 'Invalid purchasing_status').notEmpty();
    req.check('data.prepare_date', 'Invalid prepare_date').notEmpty();
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