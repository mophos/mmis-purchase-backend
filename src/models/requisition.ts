import Knex = require('knex');
import * as moment from 'moment';

export class RequisitionModel {

  public tableName  = 'pc_purchasing_requisition';
  public primaryKey = 'requisition_id';
  
  list(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .innerJoin('pc_purchasing','pc_purchasing_requisition.purchasing_id','pc_purchasing.purchasing_id')
      .leftJoin('mm_labelers','pc_purchasing_requisition.labeler_id','mm_labelers.labeler_id')
      .leftJoin('pc_committee','pc_purchasing_requisition.verify_committee_id','pc_committee.committee_id')
      .orderBy('pc_purchasing_requisition.purchasing_id','DESC')
      .limit(limit)
      .offset(offset);
  }

  type(knex: Knex, type: string = null, limit: number = 100, offset: number = 0) {

    let sumRequisition = knex
    .count('po.requisition_id')
    .from('pc_purchasing_order as po')
    .whereRaw('po.requisition_id = pr.requisition_id')
    .groupBy('po.requisition_id').as('puchase_order_count')

    let sumItems = knex
    .count('pri.requisition_id')
    .from('pc_purchasing_requisition_item as pri')
    .whereRaw('pri.requisition_id = pr.requisition_id')
    .groupBy('pri.requisition_id').as('requisition_order_count')

    return knex(`${this.tableName} as pr`)
      .select( sumRequisition,sumItems,'pr.*','pc.*','mm_labelers.labeler_name','pc_committee.committee_name')
      .innerJoin('pc_purchasing as pc','pr.purchasing_id','pc.purchasing_id')
      .leftJoin('mm_labelers','pr.labeler_id','mm_labelers.labeler_id')
      .leftJoin('pc_committee','pr.verify_committee_id','pc_committee.committee_id')
      .where('pr.requisition_status', type)
      .where('pr.is_cancel', 0)
      .orderBy('pr.purchasing_id','DESC')
  }

    cancel(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .innerJoin('pc_purchasing','pc_purchasing_requisition.purchasing_id','pc_purchasing.purchasing_id')
      .leftJoin('mm_labelers','pc_purchasing_requisition.labeler_id','mm_labelers.labeler_id')
      .leftJoin('pc_committee','pc_purchasing_requisition.verify_committee_id','pc_committee.committee_id')
      .where('pc_purchasing_requisition.is_cancel',1)
      .orderBy('pc_purchasing_requisition.purchasing_id','DESC')
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
      .innerJoin('pc_purchasing','pc_purchasing_requisition.purchasing_id','pc_purchasing.purchasing_id')
      .leftJoin('mm_labelers','pc_purchasing_requisition.labeler_id','mm_labelers.labeler_id')
      .leftJoin('pc_committee','pc_purchasing_requisition.verify_committee_id','pc_committee.committee_id')
      .where(this.primaryKey, id);
  }

  one(knex: Knex, id: string) {
    return knex(this.tableName)
      .where(this.primaryKey, id);
  }

  remove(knex: Knex, id: string) {
    return knex(this.tableName)
      .where(this.primaryKey, id)
      .del();
  }

}