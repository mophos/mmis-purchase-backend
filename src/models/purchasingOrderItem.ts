import Knex = require('knex');
import * as moment from 'moment';
import * as express from 'express';

export class PurchasingOrderItemModel {

  public tableName = 'pc_purchasing_order_item';
  public primaryKey = 'purchase_order_item_id';

  load(req: express.Request) {
    let data = req.body.data;
    return data;
  }

  validate(req: express.Request, res: express.Response) {
    req.check('data.po_id', 'Invalid po_id').notEmpty();
    req.check('data.purchasing_id', 'Invalid purchasing_id').notEmpty();
    req.check('data.product_id', 'Invalid product_id').notEmpty();
    req.check('data.generic_id', 'Invalid generic_id').notEmpty();
    req.check('data.qty', 'Invalid qty').notEmpty();
    req.check('data.created_date', 'Invalid created_date').notEmpty();
    req.check('data.updated_date', 'Invalid updated_date').notEmpty();
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

  listByorderid(knex: Knex, orderId: string, limit: number = 10, offset: number = 0) {
    let fullname = knex.raw("concat(p.product_name,' [',gd.generic_name,'] ') as fullname");
    return knex(this.tableName)
      .select('pc_purchasing_order_item.*', 'p.*', fullname, 'gd.generic_name',
        knex.raw('ifnull(ug.qty, 0) as small_qty'), 'u1.unit_name as from_unit_name', 'u2.unit_name as to_unit_name',
        knex.raw(`(SELECT qty from pc_purchasing_order_item poi JOIN pc_purchasing_order po ON poi.purchase_order_id = po.purchase_order_id  where poi.purchase_order_id != '${orderId}' and poi.product_id=p.product_id AND po.is_cancel = 'N' 
        AND ( po.purchase_order_status = 'COMPLETED' OR po.purchase_order_status = 'APPROVED' ) ORDER BY purchase_order_item_id desc limit 1) as old_qty`))
      //.leftJoin('mm_labelers', 'pc_purchasing_order_item.labeler_id', 'mm_labelers.labeler_id')
      //.leftJoin('mm_packages','pc_purchasing_order_item.package_id','mm_packages.package_id')
      .innerJoin('mm_products as p', 'pc_purchasing_order_item.product_id', 'p.product_id')
      .innerJoin('mm_generics as gd', 'gd.generic_id', 'p.generic_id')
      .leftJoin('mm_unit_generics as ug', 'ug.unit_generic_id', 'pc_purchasing_order_item.unit_generic_id')
      .leftJoin('mm_units as u1', 'u1.unit_id', 'ug.from_unit_id')
      .leftJoin('mm_units as u2', 'u2.unit_id', 'ug.to_unit_id')
      .where('pc_purchasing_order_item.purchase_order_id', orderId)
      .limit(limit)
      .offset(offset);
  }

  listByProductId(knex: Knex, productId: string, limit: number = 100, offset: number = 0) {
    let fullname = knex.raw("concat(p.product_name,' [',gd.generic_name,'] ') as fullname");
    return knex(this.tableName)
      .select('pc_purchasing_order_item.*', 'p.*', fullname)
      .innerJoin('mm_products as p', 'pc_purchasing_order_item.product_id', 'p.product_id')
      .innerJoin('mm_generics as gd', 'gd.generic_id', 'p.generic_id')
      .where('pc_purchasing_order_item.product_id', productId)
      .orderBy('pc_purchasing_order_item.updated_date', 'DESC')
      .limit(limit)
      .offset(offset);
  }

  listByorderidNoRelation(knex: Knex, orderId: string, limit: number = 100, offset: number = 0) {
    return knex(this.tableName)
      .where('purchase_order_id', orderId)
      .limit(limit)
      .offset(offset);
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

  removePurchaseItem(knex: Knex, purchaseOrderId: string) {
    return knex(this.tableName)
      .where('purchase_order_id', purchaseOrderId)
      .del();
  }

  removeAll(knex: Knex, ids: Array<any>) {
    return knex(this.tableName)
      .whereIn(this.primaryKey, ids)
      .del();
  }
}