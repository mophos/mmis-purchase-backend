import Knex = require('knex');
import * as moment from 'moment';
import * as express from 'express';
import genericType from '../routes/genericType';

export class ProductsModel {

  byPlaning(knex: Knex, year: string, limit: number = 100, offset: number = 0) {
    return knex('bm_planning as pn')
      .select('pn.generic_id', 'bg.budget_id', 'pn.package_id', 'vg.*', 'pk.*')
      .innerJoin('bm_bglist as bl', 'bl.subbg_id', 'pn.subbud_id')
      .innerJoin('bm_budget as bg', 'bg.budget_id', 'bl.budget_id')
      .innerJoin('view_generics as vg', 'vg.generic_id', 'pn.generic_id')
      .leftJoin('mm_packages as pk', 'pk.package_id', 'pn.package_id')
      .where({
        'bg.budget_year': year,
        'bl.status': 1
      })
      .groupBy('pn.generic_id', 'pn.package_id')
  }

  orderspointAll(knex: Knex, query: string = '', type = 'all', limit: number = 100, offset: number = 0) {
    let _query = `%${query}%`;
    let nullColumn = knex.raw("null as contract_id");
    return knex('view_products_labeler as pl')
      .select(
      'pl.*',
      'vu.from_unit_id',
      'vu.to_unit_id',
      'vu.unitname_from',
      'vu.unitname_to',
      'vu.qty',
      'r.total as remain')
      .innerJoin('view_mm_unit_products as vu', 'vu.unit_product_id', 'pl.purchase_unit_id')
      .leftJoin('view_remain_all_products as r', 'r.product_id', 'pl.product_id')
      .whereRaw(`( pl.product_name like '${_query}' or pl.generic_name like '${_query}' )`)
  }

  types(knex:Knex,types){
    return knex('mm_generic_types').whereIn('generic_type_id',types)
  }

  getOrderProductListByGeneric(knex: Knex, warehouseId: any, genericId: any) {
    let sql = `
    select mp.generic_id, mp.working_code, mp.product_id, mp.product_name, mp.purchase_cost, mp.is_lot_control,
    mp.primary_unit_id, mp.m_labeler_id, mp.v_labeler_id, mp.purchase_unit_id,
    lm.labeler_name as m_labeler_name, lv.labeler_name as v_labeler_name,
    u.unit_name as primary_unit_name, uf.unit_name as from_unit_name,
    ut.unit_name as to_unit_name, ug.qty as conversion_qty, mp.purchase_unit_id as unit_generic_id,
    (
      select sum(wp.qty) as total from wm_products as wp where wp.product_id=mp.product_id
      and wp.warehouse_id=?
    ) as remain_qty, 
    0 as order_qty

    from mm_products as mp
    inner join mm_labelers as lm on lm.labeler_id=mp.m_labeler_id
    inner join mm_labelers as lv on lv.labeler_id=mp.v_labeler_id
    inner join mm_units as u on u.unit_id=mp.primary_unit_id
    inner join mm_unit_generics as ug on ug.unit_generic_id=mp.purchase_unit_id
    inner join mm_units as uf on uf.unit_id=ug.from_unit_id
    inner join mm_units as ut on ut.unit_id=ug.to_unit_id

    where mp.generic_id=?

    and mp.is_active='Y' and mp.mark_deleted='N'
    group by mp.product_id
    `;

    return knex.raw(sql, [warehouseId, genericId]);
  }

  getOrderPoint(knex: Knex, warehouseId: any, query: string = '', genericTypeIds: string[], limit: number = 100, offset: number = 0) {
    let _query = `${query}%`;

    let subQuery = knex('wm_products as wp')
      .select(knex.raw('ifnull(sum(wp.qty), 0)'))
      .innerJoin('mm_products as mp', 'mp.product_id', 'wp.product_id')
      .whereRaw('mp.generic_id=mg.generic_id')
      .where('wp.warehouse_id', warehouseId)
      .as('remain_qty');
    
    let subQueryPurchased = knex('pc_purchasing_order_item as pci')
      .select(knex.raw('sum(pci.qty*ug.qty) as total_qty'))
      .innerJoin('pc_purchasing_order as pco', 'pco.purchase_order_id', 'pci.purchase_order_id')
      .innerJoin('mm_unit_generics as ug', 'ug.unit_generic_id', 'pci.unit_generic_id')
      .innerJoin('mm_products as mp', 'mp.product_id', 'pci.product_id')
      .whereRaw('pco.purchase_order_status in ("ORDERPOINT", "PREPARED", "CONFIRM", "CONFIRMED")')
      .whereRaw('pco.is_cancel="N"')
      .whereRaw('mp.generic_id=mg.generic_id')
      .whereRaw(`pco.purchase_order_id not in (
        select purchase_order_id from wm_receives as rp
        inner join wm_receive_approve as ra on ra.receive_id = rp.receive_id
      )`)
    .as('total_purchased')

    const con = knex('mm_generics as mg')
      .select(subQueryPurchased, subQuery, 'gt.generic_type_name', 'u.unit_name as primary_unit_name',
        'mg.working_code', 'mg.generic_id', 'mg.generic_name', 'mg.min_qty', 'mg.max_qty')
      .innerJoin('mm_generic_types as gt', 'gt.generic_type_id', 'mg.generic_type_id')
      .innerJoin('mm_units as u', 'u.unit_id', 'mg.primary_unit_id')
      .whereRaw('mg.mark_deleted="N" and mg.is_active="Y"')
      .where('mg.generic_name', 'like', _query)
      .havingRaw('remain_qty<=mg.min_qty')
      // .havingRaw('remain_qty<=mg.min_qty and remain_qty>0')
      .whereIn('mg.generic_type_id', genericTypeIds)
      .orderBy('mg.generic_name');
    
    con.limit(limit).offset(offset)
    return con;
  }

  getTotalOrderPoint(knex: Knex, warehouseId: any, query: string = '', genericTypeIds: string[]) {
    let _query = `${query}%`;

    let subQuery = knex('wm_products as wp')
      .select(knex.raw('ifnull(sum(wp.qty), 0)'))
      .innerJoin('mm_products as mp', 'mp.product_id', 'wp.product_id')
      .whereRaw('mp.generic_id=mg.generic_id')
      .where('wp.warehouse_id', warehouseId)
      .as('remain_qty');
    
    const con = knex('mm_generics as mg')
      .select(
        subQuery, 'mg.working_code', 'mg.generic_id', 'mg.generic_name', 'mg.min_qty', 'mg.max_qty')
      .innerJoin('mm_generic_types as gt', 'gt.generic_type_id', 'mg.generic_type_id')
      .whereRaw('mg.mark_deleted="N" and mg.is_active="Y"')
      .where('mg.generic_name', 'like', _query)
      // .havingRaw('remain_qty<=mg.min_qty and remain_qty>0')
      .havingRaw('remain_qty<=mg.min_qty')
      .whereIn('mg.generic_type_id', genericTypeIds)
      .orderBy('mg.generic_name');

    return con;
  }

  orderspoint(knex: Knex, query: string = '', contract: string = 'all', minmaxFilter: string = 'min', generictype: string = null, count: boolean = false, limit: number = 100, offset: number = 0) {
    let _query = `%${query}%`;
    const con = knex('wm_products as p')
      .select(
      knex.raw('0 as isContract'),
      'l.labeler_name',
      'l.labeler_id',
      'p.product_id',
      'mp.product_name',
      'r.total as remain',
      'ufrom.unit_name as unitname_from',
      'uto.unit_name as unitname_to',
      'ug.cost',
      'ug.qty as to_unit_qty',
      'gt.generic_type_name',
      'gd.*')
      .innerJoin('mm_products as mp', 'mp.product_id', 'p.product_id')
      .innerJoin('mm_generics as gd', 'gd.generic_id', 'mp.generic_id')
      .innerJoin('mm_generic_types as gt', 'gt.generic_type_id', 'gd.generic_type_id')
      .leftJoin('view_remain_all_products as r', 'r.product_id', 'p.product_id')
      .leftJoin('mm_unit_generics as ug', 'ug.unit_generic_id', 'mp.purchase_unit_id')
      .leftJoin('mm_units as ufrom', 'ufrom.unit_id', 'ug.from_unit_id')
      .leftJoin('mm_units as uto', 'uto.unit_id', 'ug.to_unit_id')
      .leftJoin('mm_labelers as l', 'l.labeler_id', 'mp.v_labeler_id')
      .where('mp.mark_deleted', 'N')
      .whereRaw('r.total<=gd.min_qty')
      .whereRaw(`( mp.product_name like '${_query}' or gd.generic_name like '${_query}' )`)
      .groupBy('mp.product_id')
    if (generictype !== 'null') {
      con.where('gt.generic_type_id', generictype)
    }
    if (count === true) {
      return con.count(' p.product_id as total');
    } else {
      con.limit(limit)
        .offset(offset)
      return con;
    }
  }

  orderspoint_(knex: Knex, query: string = '', contract: string = 'all', minmaxFilter: string = 'min', count: boolean = false, limit: number = 100, offset: number = 0) {
    let _query = `%${query}%`;
    let subPoTotal = knex('pc_purchasing_order_item as pi')
      .select('pi.product_id', knex.raw('sum( pi.qty ) AS order_lage_quantity'), knex.raw('sum( pi.small_qty ) AS order_small_quantity'))
      .innerJoin('pc_purchasing_order as po', 'po.purchase_order_id', 'pi.purchase_order_id')
      .where('po.purchase_order_status', 'APPROVED')
      .groupBy('pi.product_id').as('pototal')

    let con = knex('view_products_labeler as pl')
      .select(
      'pl.*',
      'vu.from_unit_id',
      'vu.to_unit_id',
      'vu.unitname_from',
      'vu.unitname_to',
      'vu.qty',
      'cm.contract_id',
      'cm.contract_ref',
      'cm.labeler_people',
      'cm.labeler',
      'cm.budget_source',
      'cm.bid_type',
      'cm.bid_process',
      'cmlabeler.labeler_name as cm_labeler_name',
      knex.raw(`IF( cm.contract_id IS NULL, 0, 1 ) AS isContract`),
      knex.raw(`IF( rm.total IS NULL, 0, rm.total ) AS remain`),
      knex.raw(`IF( pototal.order_lage_quantity IS NULL, 0, pototal.order_lage_quantity ) AS order_lage_quantity`),
      knex.raw(`IF( pototal.order_small_quantity IS NULL, 0, pototal.order_small_quantity ) AS order_small_quantity`)
      )
      .leftJoin('view_mm_unit_products as vu', 'vu.unit_product_id', 'pl.purchase_unit_id')
      .leftJoin('view_cm_product as cm', w => {
        w.on('cm.product_id', 'pl.product_id')
          .on('cm.isactive', '1')
          .on(knex.raw(' date(NOW()) BETWEEN cm.start_date AND cm.expire_date'))
      })
      .leftJoin('view_remain_all_products as rm', 'rm.product_id', 'pl.product_id')
      .leftJoin('mm_labelers as cmlabeler ', 'cmlabeler.labeler_id', 'cm.labeler')
      .leftJoin(subPoTotal, 'pototal.product_id', 'pl.product_id')
      .whereRaw(`( pl.product_name like '${_query}' or pl.generic_name like '${_query}' )`);

    if (contract == 'contract')
      con.whereRaw(`cm.contract_id is not null`)
    else if (contract == 'nocontract')
      con.whereRaw(`cm.contract_id is null`)

    if (minmaxFilter === 'min') {
      con.whereRaw(`pl.min_qty > if(rm.total is null,0,rm.total) `)
    }
    con.limit(limit)
      .offset(offset);
    return count === true ? con.count('* as total') : con;
  }

  orderspointOld(knex: Knex, query: string = '', contract: Array<any> = [1, 0], limit: number = 100, offset: number = 0) {
    let _query = `%${query}%`;
    return knex.raw(` SELECT
        pl.*,
        vu.from_unit_id,
        vu.to_unit_id,
        vu.unitname_from,
        vu.unitname_to,
        vu.qty,
      IF
        ( cm.contract_id IS NULL, 0, 1 ) AS isContract,
        cm.contract_id,
      IF
        (
          rm.total IS NULL,
          0,
          rm.total 
        ) AS remain,
      IF
        (
          pototal.order_lage_quantity IS NULL,
          0,
          pototal.order_lage_quantity 
        ) AS order_lage_quantity,
        IF
        (
          pototal.order_small_quantity IS NULL,
          0,
          pototal.order_small_quantity 
        ) AS order_small_quantity 
      FROM
        view_products_labeler AS pl
        INNER JOIN view_mm_unit_products AS vu ON vu.unit_product_id = pl.purchase_unit_id
        LEFT JOIN view_cm_product AS cm ON cm.product_id = pl.product_id and date(NOW()) BETWEEN cm.start_date AND cm.expire_date and cm.isactive = 1
        LEFT JOIN view_remain_all_products AS rm ON rm.product_id = pl.product_id
        LEFT JOIN (
        SELECT
          pi.product_id,
          sum( pi.qty ) AS order_lage_quantity,
          sum( pi.small_qty ) AS order_small_quantity 
        FROM
          pc_purchasing_order_item AS pi
          INNER JOIN pc_purchasing_order AS po ON po.purchase_order_id = pi.purchase_order_id 
        WHERE
          po.purchase_order_status = 'APPROVED' 
        GROUP BY
        pi.product_id 
        ) AS pototal ON pototal.product_id = pl.product_id
        where (pl.product_name LIKE :query or pl.generic_name LIKE :query ) and IF( cm.contract_id IS NULL, 0, 1 ) in (:isContract)
    `, {
        query: _query,
        isContract: contract.join(',')
      });
    //and IF( cm.contract_id IS NULL, 0, 1 ) in (:isContract)
  }

  orderspointContract(knex: Knex, query: string = '', limit: number = 100, offset: number = 0) {
    let _query = `%${query}%`;
    let nullColumn = knex.raw("null as contract_id");
    return knex('view_products_labeler as pl')
      .select('pl.*',
      'cmp.contract_id',
      'vu.from_unit_id',
      'vu.to_unit_id',
      'vu.unitname_from',
      'vu.unitname_to',
      'vu.qty',
      'r.total as remain')
      .innerJoin('view_mm_unit_products as vu', 'vu.unit_product_id', 'pl.purchase_unit_id')
      .innerJoin('view_remain_all_products as r', 'r.product_id', 'pl.product_id')
      .innerJoin('view_cm_product as cmp', 'cmp.product_id', 'pl.product_id')
      .whereRaw(`( pl.product_name like '${_query}' or pl.generic_name like '${_query}' )`)
      .whereRaw('date(NOW()) BETWEEN cmp.start_date AND cmp.expire_date and cmp.isactive = 1');
  }

  orderspointNoContract(knex: Knex, query: string = '', type = 'all', limit: number = 100, offset: number = 0) {
    let _query = `%${query}%`;
    let nullColumn = knex.raw("null as contract_id");
    return knex('view_products_labeler as pl')
      .select('pl.*',
      nullColumn,
      'vu.from_unit_id',
      'vu.to_unit_id',
      'vu.unitname_from',
      'vu.unitname_to',
      'vu.qty',
      'r.total as remain')
      .innerJoin('view_mm_unit_products as vu', 'vu.unit_product_id', 'pl.purchase_unit_id')
      .innerJoin('view_remain_all_products as r', 'r.product_id', 'pl.product_id')
      .whereRaw(`( pl.product_name like '${_query}' or pl.generic_name like '${_query}' )`)
      .whereNotExists(function () {
        this.select('view_cm_product.product_id').from('view_cm_product').whereRaw('view_cm_product.product_id = pl.product_id');
      })
  }

  allProduct(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex('mm_products')
      .limit(limit)
      .offset(offset);
  }

  products(knex: Knex, limit: number = 100, offset: number = 0) {
    return knex('mm_products')
      .innerJoin('mm_product_labeler', 'mm_products.product_id', 'mm_product_labeler.product_id')
      .innerJoin('mm_generic_product', 'mm_products.product_id', 'mm_generic_product.product_id')
      .leftJoin('view_generics', 'mm_generic_product.generic_id', 'view_generics.generic_id')
      .innerJoin('mm_product_package', 'mm_products.product_id', 'mm_product_package.product_id')
      .leftJoin('mm_packages', 'mm_product_package.package_id', 'mm_packages.package_id')
      .innerJoin('mm_labelers', 'mm_product_labeler.labeler_id', 'mm_labelers.labeler_id')
      .groupBy('mm_products.product_id')
      .limit(limit)
      .offset(offset);
  }

  productsByLabelerOld(knex: Knex, lebelerId: string, q: string = "", limit: number = 100, offset: number = 0) {
    return knex('mm_products')
      .innerJoin('mm_product_labeler', 'mm_products.product_id', 'mm_product_labeler.product_id')
      .innerJoin('mm_generic_product', 'mm_products.product_id', 'mm_generic_product.product_id')
      .leftJoin('view_generics', 'mm_generic_product.generic_id', 'view_generics.generic_id')
      .innerJoin('mm_product_package', 'mm_products.product_id', 'mm_product_package.product_id')
      .leftJoin('mm_packages', 'mm_product_package.package_id', 'mm_packages.package_id')
      .innerJoin('mm_labelers', 'mm_product_labeler.labeler_id', 'mm_labelers.labeler_id')
      .where('mm_labelers.labeler_id', lebelerId)
      .where('mm_products.product_name', 'like', `%${q}%`)
      .groupBy('mm_products.product_id')
      .limit(limit)
      .offset(offset);
  }

  productsByLabeler(knex: Knex, lebelerId: string, q: string = "", limit: number = 10, offset: number = 0) {
    let concat = knex.raw("concat(p.product_name,' [',gd.generic_name,'] ') as fullname");
    return knex('mm_products as p')
      .select('p.product_id', 'p.product_name', 'gd.generic_id', 'gd.generic_name', concat)
      .innerJoin('mm_generics as gd', 'gd.generic_id', 'p.generic_id')
      .where('p.mark_deleted', 'N')
      .where('p.v_labeler_id', lebelerId)
      .where(w => {
        w.where('p.product_name', 'like', `%${q}%`)
        .orWhere('gd.generic_name', 'like', `%${q}%`)
        .orWhere('p.keywords', 'like', `%${q}%`)
      })
      .orderBy('p.product_name')
      .limit(limit)
      .offset(offset);
  }

  list(knex: Knex) {
    return knex.raw(`
        SELECT
          gd.generic_id,
          p.product_id,
          gd.generic_name,
          gd.generic_type,
          concat(sum(qty),' ',pk.large_unit, ' x ',pk.small_qty,' ',pk.small_unit) package,
          concat(pk.small_qty * sum(qty) ,' ',pk.small_unit) qty
        FROM
          wm_products p
        INNER JOIN mm_generic_product gp on gp.product_id = p.product_id
        INNER JOIN (
              SELECT generic_id, generic_name, 'drugs' as generic_type
              FROM mm_generic_drugs
              UNION ALL
              SELECT generic_id, generic_name, 'supplies' as generic_type
              FROM mm_generic_supplies
        ) gd on gd.generic_id = gp.generic_id

        INNER JOIN mm_packages pk ON pk.package_id = p.package_id
        WHERE NOT EXISTS ( 	
          SELECT cp.product_id 
          FROM cm_contract cc
          INNER JOIN cm_product cp on cp.contract_ref = cc.contract_ref
          WHERE cc.\`status\` = 4 AND cp.product_id = gd.generic_id
        ) 
        GROUP BY p.product_id,p.package_id
    `);
  }

  listByGenericType(knex: Knex, type: string) {
    return knex.raw(`
      SELECT
        gd.generic_id,
        gd.generic_type,
        p.product_id,
        gd.generic_name,
        concat(sum(qty),' ',pk.large_unit, ' x ',pk.small_qty,' ',pk.small_unit) package,
        concat(pk.small_qty * sum(qty) ,' ',pk.small_unit) qty
      FROM
        wm_products p
      INNER JOIN mm_generic_product gp on gp.product_id = p.product_id
      INNER JOIN (
              SELECT generic_id, generic_name, 'drugs' as generic_type
              FROM mm_generic_drugs
              UNION ALL
              SELECT generic_id, generic_name, 'supplies' as generic_type
              FROM mm_generic_supplies
      ) gd on gd.generic_id = gp.generic_id
      INNER JOIN mm_packages pk ON pk.package_id = p.package_id
      WHERE gd.generic_type = ? AND NOT EXISTS ( 	
        SELECT cp.product_id 
        FROM cm_contract cc
        INNER JOIN cm_product cp on cp.contract_ref = cc.contract_ref
        WHERE cc.\`status\` = 4 AND cp.product_id = gd.generic_id
      ) 
      GROUP BY p.product_id,p.package_id      
    `, [type]);
  }

  withOutContract(knex: Knex) {
    return knex.raw(`
      SELECT
        p.product_id,
        mp.product_name,
        gn.generic_id,
        gn.generic_name,
        gn.generic_type,
        p.package_id,
        pk.large_qty,
        pk.large_unit,
        pk.small_qty,
        pk.small_unit,
        sum(p.qty) qty,
        concat(sum(qty),' ',pk.large_unit, ' x ',pk.small_qty,' ',pk.small_unit) package,
        concat(pk.small_qty * sum(qty) ,' ',pk.small_unit) qty_unit,
        mx.min_inventory,
        ml.labeler_name,
        ml.labeler_id,
        av.abc_id,
        av.ven_id
      FROM
        wm_products p
      INNER JOIN mm_generic_product gp ON gp.product_id = p.product_id
      INNER JOIN mm_product_labeler mpl on p.product_id = mpl.product_id
      INNER JOIN mm_products mp on p.product_id = mp.product_id
      INNER JOIN mm_labelers ml on mpl.labeler_id = ml.labeler_id
      INNER JOIN view_generics gn ON gn.generic_id = gp.generic_id
      INNER JOIN mm_packages pk ON p.package_id = pk.package_id
      INNER JOIN ds_generic_calcution mx on gn.generic_id = mx.generic_id
      INNER JOIN wm_product_abc_ven av on gn.generic_id = av.generic_id

      WHERE NOT EXISTS (
        SELECT
          cd.product_id AS generic_id
        FROM
          cm_contract ct
        INNER JOIN cm_product cd ON ct.contract_ref = cd.contract_ref
        WHERE ct.\`status\` = 4 and cd.product_id = gp.generic_id
      ) 
      GROUP BY p.product_id
    `);
  }

  byContract(knex: Knex) {
    return knex.raw(`
        SELECT
          p.product_id,
          mp.product_name,
          gn.generic_id,
          gn.generic_name,
          gn.generic_type,
          p.package_id,
          pk.large_qty,
          pk.large_unit,
          pk.small_qty,
          pk.small_unit,          
          sum(p.qty) qty,
          concat(pk.large_qty, ' ' ,pk.large_unit, ' x ',pk.small_qty,' ',pk.small_unit) package,
          concat(pk.small_qty * sum(qty) ,' ',pk.small_unit) qty_unit,
          mx.min_inventory,
          av.abc_id,
          av.ven_id,
          #====== contracts ======
          c.contract_ref,
          c.contract_id,
          c.amount,
          c.bid_process,
          c.budget_source,
          c.start_date,
          c.expire_date,
          c.contract_date,
          c.contract_year,
          c.labeler_id,
          c.product_amount,
          c.product_price,
          c.unit_major,
          c.unit_minor,
          c.unit_qty,
          c.labeler_name
        FROM
          wm_products p
        INNER JOIN mm_generic_product gp ON gp.product_id = p.product_id
        INNER JOIN mm_products mp on p.product_id = mp.product_id
        INNER JOIN(
          SELECT
            generic_id,
            generic_name,
            'drugs' AS generic_type
          FROM
            mm_generic_drugs
          UNION ALL
            SELECT
              generic_id,
              generic_name,
              'supplies' AS generic_type
            FROM
              mm_generic_supplies
        )gn ON gn.generic_id = gp.generic_id
        INNER JOIN mm_packages pk ON p.package_id = pk.package_id
        INNER JOIN ds_generic_calcution mx on gn.generic_id = mx.generic_id
        INNER JOIN wm_product_abc_ven av on gn.generic_id = av.generic_id
        INNER JOIN (
            SELECT
              ct.contract_ref,
              ct.contract_id,
              ct.amount,
              ct.bid_process,
              ct.budget_source,
              ct.start_date,
              ct.expire_date,
              ct.contract_date,
              ct.contract_year,
              ct.labeler AS labeler_id,
              cd.product_id AS generic_id,
              cd.product_amount,
              cd.product_price,
              cd.unit_major,
              cd.unit_minor,
              cd.unit_qty,
              l.labeler_name
            FROM
              cm_contract ct
            INNER JOIN cm_product cd ON ct.contract_ref = cd.contract_ref
            INNER JOIN mm_labelers l on ct.labeler = l.labeler_id
            WHERE ct.\`status\` = 4
        ) c on gp.generic_id = c.generic_id
        GROUP BY p.product_id
         order by c.contract_id, mp.product_name
    `);
  }

  genericPlainning(knex: Knex) {
    return knex.raw(`
        SELECT
          gb.generic_id,
          gd.generic_name,
          gb.qty,
          gb.amount,
          pk.small_unit
        FROM
          bm_planning gb
        INNER JOIN mm_generic_drugs gd ON gd.generic_id = gb.generic_id
        INNER JOIN mm_packages pk on pk.package_id = gb.package_id
    `);
  }
}
