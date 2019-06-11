import Knex = require('knex');
import * as moment from 'moment';

export class OfficerModel {

  getSetting(knex: Knex) {
    return knex('settings').limit(1);
  }

  getSysSetting(knex: Knex, actionName) {
    if (actionName === '') {
      return knex('sys_settings as s')
        .select('s.*', 'm.module_name')
        .leftJoin('sys_module as m', 's.module_id', 'm.module_id')
        .where('s.form_edit', '=', '1')
        .orderBy('s.action_name');
    } else {
      return knex('sys_settings')
        .where('action_name', '=', actionName)
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
      .where('action_name', '=', varName);
  }

  remove(knex: Knex) {
    return knex('settings')
      .del();
  }

  savePurchasingOfficer(knex: Knex, data) {
    return knex('um_purchasing_officer').insert(data);
  }
  updatePurchasingOfficer(knex: Knex, officerId: number, data) {
    return knex('um_purchasing_officer').update(data)
      .where('p_id', officerId)

  }
  updatePurchasingOfficerType(knex: Knex, typeId: number, data) {
    return knex('um_purchasing_officer_type').update(data)
      .where('type_id', typeId)

  }
  getPurchasingOfficer(knex: Knex) {
    return knex('um_purchasing_officer as pu')
      .select('pu.officer_id', 'pu.people_id', 'pu.type_code', 'pu.type_name as type_show', 'pot.type_name', 'pu.is_actived', knex.raw('concat(t.title_name,p.fname," ",p.lname) AS fullname'))
      .innerJoin('um_people as p', 'pu.people_id', 'p.people_id')
      .innerJoin('um_titles as t', 't.title_id', 'p.title_id')
      .innerJoin('um_purchasing_officer_type as pot', 'pot.type_code', 'pu.type_code')
      .where('pu.is_actived', 'Y')
    // .where('pu.is_deleted', 'N');
  }

  getPurchasingOfficerType(knex: Knex) {
    return knex('um_purchasing_officer_type');
  }

  getPeoples(knex: Knex) {
    return knex('um_people');
  }


  deleteOfficer(knex: Knex, officerId) {
    return knex('um_purchasing_officer')
      .update('is_actived', 'N')
      .where('officer_id', officerId);
  }

  editTypeShow(knex: Knex, officerId, data) {
    return knex('um_purchasing_officer')
      .update(data)
      .where('officer_id', officerId);
  }

  unActive(knex: Knex, peopleId, typeCode) {
    return knex('um_purchasing_officer')
      .update({ 'is_actived': 'N' })
      .where('people_id', peopleId)
      .where('type_code', typeCode);
  }

  changeTypeShow(knex: Knex, officerId, data) {
    return knex('um_purchasing_officer')
      .update(data)
      .where('officer_id', officerId);
  }



}