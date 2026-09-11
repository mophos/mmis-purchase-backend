import Knex = require('knex');
import * as moment from 'moment';

export class StandardModel {

  getUnitPackages(db: Knex, genericId: any) {
    return db('mm_unit_generics as mu')
      .select('mu.standard_cost', 'mu.unit_generic_id', 'mu.from_unit_id', 'mu.to_unit_id', 'mu.qty',
        'mu.cost', 'mu.cost as old_cost', 'mu1.unit_name as from_unit_name', 'mu2.unit_name as to_unit_name')
      .innerJoin('mm_units as mu1', 'mu1.unit_id', 'mu.from_unit_id')
      .innerJoin('mm_units as mu2', 'mu2.unit_id', 'mu.to_unit_id')
      .where('mu.generic_id', genericId)
      .where('mu.is_active', 'Y')
      .where('mu.is_deleted', 'N');
  }

  getUnitPackagesPurchase(db: Knex, genericId: any, productId: any) {
    return db('mm_unit_generics as mu')
      .select('mu.standard_cost', 'mu.unit_generic_id', 'mu.from_unit_id', 'mu.to_unit_id', 'mu.qty',
        'mu.cost', 'mu.cost as old_cost', 'mu1.unit_name as from_unit_name', 'mu2.unit_name as to_unit_name',
        db.raw(`if(mp.purchase_unit_id=mu.unit_generic_id,'Y','N') as is_purchase`))
      .joinRaw(`left join mm_products as mp on mp.product_id = ?`, [productId])
      .innerJoin('mm_units as mu1', 'mu1.unit_id', 'mu.from_unit_id')
      .innerJoin('mm_units as mu2', 'mu2.unit_id', 'mu.to_unit_id')
      .where('mu.generic_id', db.raw(`?`, [genericId]))
      .where('mu.is_active', 'Y')
      .where('mu.is_deleted', 'N');
  }

  getBidTypes(db: Knex) {
    return db('l_bid_type')
      .orderBy('bid_id')
      .where('isactive', 1);
  }

  getBudgetTypes(db: Knex, warehouseId: any) {
    return db('bm_budget_detail_warehouse as bbdw')
      .select('bb.bgtype_id', 'bb.bgtype_name', 'bb.isactive')
      .join('bm_budget_detail as bd', 'bd.bgdetail_id', 'bbdw.view_bgdetail_id')
      // จับคู่ด้วย "กลุ่มงบ" (ปี + ประเภท + ประเภทย่อย) แทนการเทียบ id ตรง ๆ
      // bm_budget_detail_warehouse.view_bgdetail_id เก็บ bgdetail_id แถวไหนก็ได้ในกลุ่ม
      // ขึ้นกับว่าตอนผูกคลังผู้ใช้กดแถวไหน และถ้าโอนเพิ่มงบเข้ากลุ่มเดิมภายหลัง
      // แถวใหม่ก็เข้ากลุ่มเดียวกัน การเทียบ id ตรง ๆ จึงหลุดได้ตลอด
      // bgtypesub_id เป็น null ได้ ใช้ <=> ให้ null เทียบกับ null ติด
      .joinRaw(`join view_budget_subtype as vbs
                  on vbs.bg_year = bd.bg_year
                 and vbs.bgtype_id = bd.bgtype_id
                 and vbs.bgtypesub_id <=> bd.bgtypesub_id`)
      .join('bm_bgtype as bb', 'bb.bgtype_id', 'vbs.bgtype_id')
      .where('bbdw.warehouse_id', warehouseId)
      .groupBy('bb.bgtype_id')
      .orderBy('bb.bgtype_name');
  }

  getBidProcess(db: Knex) {
    return db('l_bid_process')
      .where('is_active', 1)
      .orderBy('name');
  }

  getBudgetDetail(db: Knex, budgetYear: string, budgetTypeId: string, warehouseId: any) {
    return db('bm_budget_detail_warehouse as bbdw')
      .distinct('vs.bgdetail_id', 'vs.view_bgdetail_id', 'vs.bg_year', 'vs.bgtype_id', 'vs.bgtype_name', 'vs.bgtypesub_id', 'vs.bgtypesub_name', 'vs.remark', 'vs.amount')
      .join('bm_budget_detail as bd', 'bd.bgdetail_id', 'bbdw.view_bgdetail_id')
      // จับคู่ด้วย "กลุ่มงบ" (ปี + ประเภท + ประเภทย่อย) แทนการเทียบ id ตรง ๆ
      // bm_budget_detail_warehouse.view_bgdetail_id เก็บ bgdetail_id แถวไหนก็ได้ในกลุ่ม
      // ขึ้นกับว่าตอนผูกคลังผู้ใช้กดแถวไหน และถ้าโอนเพิ่มงบเข้ากลุ่มเดิมภายหลัง
      // แถวใหม่ก็เข้ากลุ่มเดียวกัน การเทียบ id ตรง ๆ จึงหลุดได้ตลอด
      // bgtypesub_id เป็น null ได้ ใช้ <=> ให้ null เทียบกับ null ติด
      .joinRaw(`join view_budget_subtype as vs
                  on vs.bg_year = bd.bg_year
                 and vs.bgtype_id = bd.bgtype_id
                 and vs.bgtypesub_id <=> bd.bgtypesub_id`)
      .where('bbdw.warehouse_id', warehouseId)
      .andWhere('vs.bg_year', budgetYear)
      .andWhere('vs.bgtype_id', budgetTypeId)
      // คลังเดียวอาจผูกไว้หลายแถวในกลุ่มเดียวกัน (เช่น 33 กับ 40 ของคลัง 1)
      // ต้องยุบให้เหลือกลุ่มละบรรทัด ไม่งั้นงบย่อยจะขึ้นซ้ำใน dropdown
      // ใช้ distinct แทน group by เพราะคอลัมน์ที่ select มาจาก view ทั้งหมด
      // แถวซ้ำจึงเหมือนกันทุกคอลัมน์ และไม่ติด ONLY_FULL_GROUP_BY ถ้าวันหลังเปิดใช้
  }
}