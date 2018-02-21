import Knex = require('knex');
import * as moment from 'moment';

export class RequisitionItemModel {

  public tableName = 'pc_purchasing_requisition_item';
  public primaryKey = 'requisition_itemid';

  list(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .limit(limit)
      .offset(offset);
  }

  listByRequisitionID(knex: Knex, requisitionId:string, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .innerJoin('mm_products','pc_purchasing_requisition_item.product_id','mm_products.product_id')
      .leftJoin('view_generics','pc_purchasing_requisition_item.generic_id','view_generics.generic_id')
     .innerJoin('mm_labelers','pc_purchasing_requisition_item.labeler_id','mm_labelers.labeler_id')
     .innerJoin('mm_packages','pc_purchasing_requisition_item.package_id','mm_packages.package_id')
     .where('requisition_id', requisitionId)
     .limit(limit)
     .offset(offset);
  }

  listByRequisitionIDNoRelation(knex: Knex, requisitionId:string, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
     .where('requisition_id', requisitionId)
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
  
  removeAll(knex: Knex, id: Array<any>) {
    return knex(this.tableName)
      .whereIn(this.primaryKey, id)
      .del();
  }

}