import Knex = require('knex');
import * as moment from 'moment';

export class ContractModel {

  list(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex('cm_contracts')
      .limit(limit)
      .offset(offset);
  }
  
  listGroupContactID(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex('cm_contracts')
      .groupBy('contract_id')
      .limit(limit)
      .offset(offset);
  }

  save(knex: Knex, datas: any) {
    return knex('cm_contracts')
      .insert(datas);
  }

  update(knex: Knex, id: string, datas: any) {
    return knex('cm_contracts')
      .where('contract_id', id)
      .update(datas);
  }

  detail(knex: Knex, contractId: string) {
    // total_purchase คือมูลค่าที่จัดซื้อไปทั้งหมดในสัญญานี้ รวมถึงสัญญาปัจจุบันด้วย
    let subQuery = knex('pc_purchasing_order_item as pci')
      .select(knex.raw('ifnull(sum(pci.qty*pci.unit_price), 0)'))
      .innerJoin('pc_purchasing_order as pc', 'pc.purchase_order_id', 'pci.purchase_order_id')
      .where('pci.giveaway', 'N')
      .whereRaw('pc.contract_id=ct.contract_id')
      .as('total_purchase');
    
    return knex('cm_contracts as ct')
      .select('ct.*', subQuery)
      .where('ct.contract_id', contractId);
  }

  remove(knex: Knex, id: string) {
    return knex('cm_contracts')
      .where('contract_id', id)
      .del();
  }

}