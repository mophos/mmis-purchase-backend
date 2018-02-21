import Knex = require('knex');
import * as moment from 'moment';

export class PeriodModel {
  async isPeriodClose(knex: Knex, year: number, month: number) {
    let rs: any = await knex('wm_period')
      .select('status_close')
      .where('period_year', year)
      .where('period_month', month);
    let statusClose = rs[0].status_close;

    return statusClose === 'Y' ? true : false;
    
  }
}