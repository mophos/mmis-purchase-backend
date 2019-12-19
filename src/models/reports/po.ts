import Knex = require('knex');
import * as moment from 'moment';
import * as express from 'express';
export class PoModel {

    purchasingHeader(knex: Knex, purchasingOrderId) {
        return knex('pc_purchasing_order as po')
            .select(
                'po.purchase_order_id',
                'po.purchase_order_number',
                'po.purchase_method_id',
                'po.purchase_order_book_number',
                'po.include_vat',
                'po.exclude_vat',
                'po.sub_total',
                'po.vat_rate',
                'po.total_price',
                'po.vat',
                'po.delivery',
                'po.verify_committee_id',
                'po.check_price_committee_id',
                'po.budget_detail_id',
                'po.order_date',
                'po.chief_id',
                'po.buyer_id',
                'po.supply_id',
                'po.manager_id',
                'vb.amount as budget_amount',
                'vb.bgtype_name as budget_type_name',
                'vb.bgtypesub_name as budget_type_sub_name',
                'vb.bg_year as budget_year',
                'cbp.name AS bid_process_name',
                'cbt.bid_name as bid_type_name',
                'cbt.bid_id as bid_type_id',
                'ml.address as labeler_address',
                'ml.phone as labeler_phone',
                'ml.nin as labeler_nin',
                'ml.labeler_name',
                'ml.labeler_name_po',
                'ml.zipcode as labeler_zipcode',
                'lm.tambon_name as labeler_tambon_name',
                'la.ampur_name as labeler_ampur_name',
                'lp.province_name as labeler_province_name',
                'lp.province_code as labeler_province_code',
                'bt.balance as transection_balance',
                'mb.bank_name',
                'mb.account_name',
                'mb.account_no'
            )
            .leftJoin('mm_labelers as ml', 'ml.labeler_id', 'po.labeler_id')
            .leftJoin('mm_labeler_bank as mb', 'ml.labeler_id', 'mb.labeler_id')
            .leftJoin(knex.raw('l_tambon as lm on lm.tambon_code = ml.tambon_code and lm.ampur_code = ml.ampur_code and lm.province_code = ml.province_code'))
            .leftJoin(knex.raw('l_ampur as la on la.ampur_code = ml.ampur_code and la.province_code = ml.province_code'))
            .leftJoin(knex.raw('l_province as lp on lp.province_code = ml.province_code'))
            .leftJoin('l_bid_process as cbp', 'cbp.id', 'po.purchase_method_id')
            .leftJoin('l_bid_type as cbt', 'cbt.bid_id', 'po.purchase_type_id')
            .leftJoin('view_budget_subtype as vb', 'vb.view_bgdetail_id', 'po.budget_detail_id')
            .joinRaw(`left join pc_budget_transection as bt on bt.purchase_order_id = po.purchase_order_id and transaction_status='spend'`)
            .whereIn('po.purchase_order_id', purchasingOrderId)
            .andWhere('po.is_cancel', 'N');
    }

    purchasingPO(knex: Knex, porder: any, warehouseId: any) {
        return knex('pc_purchasing_order as po')
            .select(
                'mup.cost',
                'mp.product_name',
                'mup.qty AS conversion',
                'muu.unit_name AS primary_unit',
                'ml.address',
                'ml.phone',
                'ml.nin',
                'poi.purchase_order_item_id',
                'cbp.NAME AS bname',
                'cbt.bid_name',
                'cbt.bid_id',
                'ml.labeler_name',
                'ml.labeler_name_po',
                'ml.zipcode',
                'lm.tambon_name',
                'la.ampur_name',
                'lp.province_name',
                'lp.province_code',
                'mg.generic_id',
                'mg.generic_name',
                'mg.working_code as generic_code',
                knex.raw(`IF
                (
                    ( SELECT standard_cost FROM mm_unit_generics WHERE unit_generic_id = poi.unit_generic_id ) = 0,
                    mg.standard_cost,
                    ( SELECT standard_cost FROM mm_unit_generics WHERE unit_generic_id = poi.unit_generic_id ) 
                ) AS standard_cost`),
                knex.raw(`IFNULL(
                    (
                SELECT
                    FLOOR(
                    ( IF ( SUM( wp.qty ) IS NULL, 0, SUM( wp.qty ) ) ) / mup.qty
                    ) 
                FROM
                    wm_products wp 
                JOIN mm_products AS mmp on mmp.product_id = wp.product_id
                WHERE
                    mg.generic_id = mmp.generic_id
                    AND wp.warehouse_id = ${warehouseId} 
                    ),
                    0 
                    ) AS balance_qty`),
                'poi.qty AS qty',
                'poi.unit_price',
                'poi.total_price AS total_price_item',
                'poi.giveaway',
                'mu.unit_name',
                'mup.standard_cost')
            .leftJoin(' pc_purchasing_order_item as poi', 'poi.purchase_order_id', 'po.purchase_order_id')
            .leftJoin('mm_products as mp', 'mp.product_id', 'poi.product_id')
            .leftJoin('mm_generics as mg', 'mp.generic_id', 'mg.generic_id')
            .leftJoin('mm_unit_generics as mup', 'mup.unit_generic_id', 'poi.unit_generic_id')
            .leftJoin('mm_units as muu', 'muu.unit_id', 'mg.primary_unit_id')
            .leftJoin('mm_units as mu', 'mu.unit_id', 'mup.from_unit_id')
            .leftJoin('mm_labelers as ml', 'ml.labeler_id', 'po.labeler_id')
            .leftJoin(knex.raw('l_tambon as lm on lm.tambon_code = ml.tambon_code and lm.ampur_code = ml.ampur_code and lm.province_code = ml.province_code'))
            .leftJoin(knex.raw('l_ampur as la on la.ampur_code = ml.ampur_code and la.province_code = ml.province_code'))
            .leftJoin(knex.raw('l_province as lp on lp.province_code = ml.province_code'))
            .leftJoin('l_bid_process as cbp', 'cbp.id', 'po.purchase_method_id')
            .leftJoin('l_bid_type as cbt', 'cbt.bid_id', 'po.purchase_type_id')
            .where('po.purchase_order_id', porder)
            .andWhereRaw('mg.generic_id IS NOT NULL')
    }

    allAmountTransaction(knex: Knex, bgdetail_id: any, budgetYear: any, pid: any) {
        const transectionId = knex('pc_budget_transection as t')
            .select('t.transection_id')
            .join('pc_purchasing_order as p', 'p.purchase_order_id', 't.purchase_order_id')
            .join('bm_budget_detail as b', 'b.bgdetail_id', 't.view_bgdetail_id')
            .where('t.view_bgdetail_id', bgdetail_id)
            .where('b.bg_year', budgetYear)
            .where('t.transaction_status', 'SPEND')
            .where('t.purchase_order_id', pid)
            .where('t.amount', '>', '0');

        return knex('pc_budget_transection as pbt')
            .sum('pbt.amount as amount')
            .leftJoin('bm_budget_detail as bbd', 'bbd.bgdetail_id', 'pbt.view_bgdetail_id')
            .leftJoin('pc_purchasing_order as po', 'po.purchase_order_id', 'pbt.purchase_order_id')
            .where('pbt.view_bgdetail_id', bgdetail_id)
            .where('bbd.bg_year', budgetYear)
            .where('pbt.transaction_status', 'SPEND')
            .where('pbt.transection_id', '<', transectionId);
    }
}

