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

  detail(knex: Knex, contractId: string, purchaseId: any = '') {
    // total_purchase คือมูลค่าที่จัดซื้อไปทั้งหมดในสัญญานี้ รวมถึงสัญญาปัจจุบันด้วย
    let subQuery = knex('pc_purchasing_order_item as pci')
      .select(knex.raw('ifnull(sum(pci.qty*pci.unit_price), 0)'))
      .innerJoin('pc_purchasing_order as pc', 'pc.purchase_order_id', 'pci.purchase_order_id')
      .where('pci.giveaway', 'N')
      .whereRaw('pc.contract_id=ct.contract_id');
    
    if (purchaseId) {
      subQuery.whereNot('pc.purchase_order_id', purchaseId);
    }
    
    subQuery.as('total_purchase');
    
    return knex('cm_contracts as ct')
      .select('ct.*', subQuery)
      .where('ct.contract_id', contractId);
  }

  detailContract(knex: Knex, contractId: any) {
    return knex('pc_purchasing_order AS po')
      .join('cm_contracts AS cc', 'po.contract_id', 'cc.contract_id')
      .join('cm_contract_detail AS ccd', 'ccd.contract_id', 'cc.contract_id')
      .where('cc.contract_id', contractId)
      .andWhereNot('po.purchase_order_status','ORDERPOINT');
  }

  remove(knex: Knex, id: string) {
    return knex('cm_contracts')
      .where('contract_id', id)
      .del();
  }

}