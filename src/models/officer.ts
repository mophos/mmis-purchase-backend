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

savePurchasingOfficer(knex: Knex,data) {
  return knex('um_purchasing_officer').insert(data);
}
updatePurchasingOfficer(knex: Knex, officerId: number, data) {
  return knex('um_purchasing_officer').update(data)
      .where('p_id',officerId)

}

getPurchasingOfficer(knex: Knex) {
  return knex('view_um_purchasing_officer').select('*');
}

getPurchasingOfficerType(knex: Knex) {
  return knex('um_purchasing_officer_type');
}

getPeoples(knex: Knex) {
  return knex('um_people');
}

deletePurchasingOfficer(knex: Knex, ref: number) {
  return knex('um_purchasing_officer').delete()
      .where('p_id', '=', ref)
      .returning(['p_id']);
}

}