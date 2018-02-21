import Knex = require('knex');
import * as moment from 'moment';

export class OfficerModel {

  getSetting(knex: Knex) {
    return knex('settings').limit(1);
  }

  getSysSetting(knex: Knex, actionName) {
    if (actionName === '') {
      return knex('sys_settings as s')
        .select('s.*','m.module_name')  
        .leftJoin('sys_module as m','s.module_id','m.module_id')  
        .where('s.form_edit', '=', '1')
        .orderBy('s.action_name');
    } else {
      return knex('sys_settings')
        .where('action_name','=',actionName)
        .limit(1);
    }
  }

  save(knex: Knex, datas: any) {
    return knex('settings')
      .insert(datas);
  }

  saveSysSettings(knex: Knex, varName, dataValue) {
    const data = {
      value: dataValue
    };

    return knex('sys_settings')
      .update(data)
      .where('action_name','=',varName);
  }

  remove(knex: Knex) {
    return knex('settings')
      .del();
  }
  selectSql(knex: Knex, tableName: string, selectText: string, whereText: string, groupBy: string, orderBy: string) {
    let sql = 'select ' + selectText + ' from ' + tableName;
    if (whereText != '') {
        sql = sql + ' where ' + whereText;
    }
    if (groupBy != '') {
        sql = sql + ' group by ' + groupBy;
    }
    if (orderBy != '') {
        sql = sql + ' order by ' + orderBy;
    }
    sql = sql + ' limit 0,5000';
    return knex.raw(sql);
}
savePurchasingOfficer(knex: Knex, ref: number, arrData) {
  if (ref > 0) {
      return knex('um_purchasing_officer').update(arrData)
          .where('p_id', '=', ref)
          .returning(['p_id']);
  } else {
      return knex('um_purchasing_officer').insert(arrData, 'p_id')
          .returning(['p_id']);
  }
}

getPurchasingOfficer(knex: Knex, ref: number) {
  if (ref > 0) {
      return knex('view_um_purchasing_officer').select('*')
          .where('p_id', '=', ref);
  } else {
      return knex('view_um_purchasing_officer').select('*');
  }
}

deletePurchasingOfficer(knex: Knex, ref: number) {
  return knex('um_purchasing_officer').delete()
      .where('p_id', '=', ref)
      .returning(['p_id']);
}

}