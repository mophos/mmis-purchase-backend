import { PurchasingOrderModel } from './../purchasingOrder';
import Knex = require('knex');
import * as moment from 'moment';
import * as express from 'express';
import { log } from 'util';

export class PurchasingOrderReportModel {

    detail(knex: Knex, id: string) {
        return knex('pc_purchasing_order as po')
            .where('po.purchase_order_id', id);
    }
    async hospital(knex: Knex) {
        let array = [];
        let result = await this.hospname(knex);
        result = JSON.parse(result[0].value);
        array.push(result);
        return array;
    }
    hospname(knex: Knex) {
        return knex.select('value').from('sys_settings').where('action_name', 'SYS_HOSPITAL');
    }
    at(knex: Knex) {
        let sql = `SELECT * FROM sys_settings WHERE action_name='BOOK_PREFIX'`;
        return knex.raw(sql);
    }
    budgetYear(knex: Knex, year) {
        let sql = `SELECT b.bgtype_name,
    SUM(bd.amount) AS amount,
    bd.bg_year
    FROM bm_bgtype b
    JOIN bm_budget_detail bd ON bd.bgtype_id=b.bgtype_id
    WHERE bd.bg_year = ?
    GROUP BY bd.bg_year`
        return knex.raw(sql, [year])
    }
    budgetType(knex: Knex, bgdetail_id: any) {
        return knex.raw(`SELECT
        b.bgtype_id,
        b.bgtype_name,
        bts.bgtypesub_name,
        bd.amount,
        bd.bg_year+543 as bg_year
        FROM bm_bgtype b
        JOIN bm_budget_detail bd ON bd.bgtype_id=b.bgtype_id
        JOIN bm_bgtypesub bts ON bts.bgtypesub_id=bd.bgtypesub_id
        WHERE bd.bgdetail_id=?`, [bgdetail_id])
    }
    items(knex: Knex, id: string) {
        return knex('pc_purchasing_order_item as i')
            .innerJoin('mm_products as p', 'i.product_id', 'p.product_id')
            .innerJoin('view_generics', 'i.generic_id', 'view_generics.generic_id')
            .where('i.purchase_order_id', id);
    }
    prettyDate(date) {
        let d = date.getDate();
        const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        let m = monthNames[date.getMonth()];
        let y = date.getFullYear() + 543;
        return d + ' ' + m + ' ' + y;
    }
    purchasingOrder(knex: Knex, purchaOrderId) {
        return knex.raw(`SELECT 
        pci.purchase_order_id,
        vg.generic_name,
        vp.product_name,
        pci.qty,
        mup.qty AS small_qty,
        mu.unit_name,
        ROUND(pci.unit_price,2) as unit,
        ROUND(pci.total_price,2) as total,
        ml.labeler_name,
        ml.address,
        pcpo.order_date,
        chief_id,
        buyer_id,
        buyer_fullname,
        buyer_position,
        pcpo.created_date,
        pcpo.delivery,
        pcpo.purchase_order_number,
        pcpo.purchase_order_book_number,
            lb.bid_name
        FROM
        pc_purchasing_order pcpo
        JOIN pc_purchasing_order_item pci ON pci.purchase_order_id=pcpo.purchase_order_id
        JOIN mm_generics vg ON pci.generic_id=vg.generic_id
        JOIN mm_labelers ml ON ml.labeler_id=pcpo.labeler_id
        JOIN mm_products vp ON vp.product_id=pci.product_id
        LEFT JOIN mm_unit_generics mup ON pci.unit_generic_id=mup.unit_generic_id
        LEFT JOIN mm_units mu ON mu.unit_id=mup.to_unit_id
        JOIN l_bid_type lb ON lb.bid_id=pcpo.purchase_type
        WHERE pcpo.purchase_order_id = ?`, [purchaOrderId]);
    }
    tPurchase(knex: Knex, createDate) {
        return knex.raw(`SELECT 
    po.created_date,
    po.purchasing_id,
    poi.purchase_order_id,
    po.created_date ,
    poi.product_id ,
    g.generic_name ,
    poi.qty ,
    poi.small_qty ,
    u.unit_name ,
    ROUND(poi.unit_price, 2) AS unit_price ,
    ROUND(poi.total_price, 2) AS total_price ,
    b.bgtype_name ,
    l.labeler_name 
    FROM
    pc_purchasing_order po 
    JOIN pc_purchasing_order_item poi ON poi.purchase_order_id = po.purchase_order_id 
    JOIN mm_labelers l ON poi.labeler_id = l.labeler_id 
    JOIN mm_generics g ON poi.generic_id = g.generic_id 
    LEFT JOIN bm_bgtype b ON b.bgtype_id = po.budgettype_id 
    LEFT JOIN mm_unit_generics uc ON uc.to_unit_id = poi.unit_generic_id
    LEFT JOIN mm_units u ON u.unit_id = uc.to_unit_id
    WHERE
    po.created_date LIKE ?`, [createDate]);
    }
    LsPurchase(knex: Knex, startdate: any, enddate: any, genericTypeId: any) {
        let sql = `SELECT
        g.generic_name,
        u.unit_name,
        pmm.min_qty,
        0 AS used,
        pmm.max_qty,
        ROUND( poi.unit_price, 2 ) AS price,
        wp.qty,
        poi.qty AS orderqty,
        mp.product_name,
        l.labeler_name
    FROM
        pc_purchasing_order po
        JOIN pc_purchasing_order_item poi ON po.purchase_order_id = poi.purchase_order_id
        JOIN mm_generics g ON g.generic_id = poi.generic_id
        LEFT JOIN mm_unit_generics ug ON ug.generic_id = poi.generic_id
        LEFT JOIN mm_units u ON u.unit_id = ug.to_unit_id
        LEFT JOIN mm_products mp ON poi.product_id = mp.product_id
        LEFT JOIN mm_labelers l ON l.labeler_id = po.labeler_id
        LEFT JOIN mm_generics pmm on pmm.generic_id = poi.generic_id
        LEFT JOIN wm_products wp ON wp.product_id = poi.product_id
    WHERE
        po.order_date BETWEEN ? 
        AND ? `;
        if (genericTypeId) {
            sql += ` AND g.generic_type_id = '${genericTypeId}'`
        }
        sql += ` GROUP BY
        g.generic_id `
        console.log(sql);
        return knex.raw(sql, [startdate, enddate]);
    }
    lPurchase(knex: Knex, startdate: any, enddate: any) {
        return knex.raw(`SELECT
        g.generic_name,
        u.unit_name,
        pmm.min_qty,
        0 AS used,
        pmm.max_qty,
        ROUND( poi.unit_price, 2 ) AS price,
        wp.qty,
        poi.qty AS orderqty,
        mp.product_name,
        l.labeler_name
    FROM
        pc_purchasing_order po
        JOIN pc_purchasing_order_item poi ON po.purchase_order_id = poi.purchase_order_id
        JOIN mm_generics g ON g.generic_id = poi.generic_id
        LEFT JOIN mm_unit_generics ug ON ug.generic_id = poi.generic_id
        LEFT JOIN mm_units u ON u.unit_id = ug.to_unit_id
        LEFT JOIN mm_products mp ON poi.product_id = mp.product_id
        LEFT JOIN mm_labelers l ON l.labeler_id = po.labeler_id
        LEFT JOIN mm_generics pmm on pmm.generic_id = poi.generic_id
        LEFT JOIN wm_products wp ON wp.product_id = poi.product_id
    WHERE
        po.order_date BETWEEN ? 
        AND ?
    GROUP BY
        g.generic_id `, [startdate, enddate]);
    }
    pPurchase(knex: Knex, startdate, enddate) {
        return knex.raw(`SELECT
    bd.name,
    COUNT(DISTINCT po.purchase_order_id) AS po,
    COUNT(po.purchase_order_id) AS list,
    ROUND(SUM(poi.total_price),2) AS cost
    FROM
    pc_purchasing_order po
    JOIN pc_purchasing_order_item poi ON poi.purchase_order_id=po.purchase_order_id
    JOIN cm_bid_process bd ON bd.id=po.purchase_method
    WHERE po.order_date BETWEEN ? AND ?
    GROUP BY bd.name ORDER BY bd.id`, [startdate, enddate]);
    }
    mPurchase(knex: Knex) {
        return knex.raw(`SELECT
    generic_type_id,
    drug_account_name,
    COUNT(product_id) AS 'amount'
    FROM view_all_product
    WHERE drug_account_id >= 1
    GROUP BY drug_account_id
    UNION
    SELECT
    generic_type_id,
    generic_type_name,
    COUNT(product_id) AS 'amount' 
    FROM view_all_product 
    WHERE generic_type_id != 1
    GROUP BY generic_type_name
    ORDER BY generic_type_id`);
    }
    pPurchasing(knex: Knex, startdate, enddate) {
        let _query = '%' + startdate + '%'
        return knex.raw(`SELECT
        mp.product_name,
        uc.qty AS conversion,
        u.unit_name AS primary_unit,
        poi.purchase_order_id,
        po.purchase_order_number,
        po.purchase_order_book_number,
        po.order_date,
        g.generic_name,
        poi.qty,
        uu.unit_name,
        ROUND( poi.unit_price, 2 ) AS unit_price,
        ROUND( poi.total_price, 2 ) AS total_price,
        l.labeler_name 
    FROM
        pc_purchasing_order po
        JOIN pc_purchasing_order_item poi ON poi.purchase_order_id = po.purchase_order_id
        JOIN mm_products mp ON mp.product_id = poi.product_id
        JOIN mm_labelers l ON po.labeler_id = l.labeler_id
        JOIN mm_generics g ON poi.generic_id = g.generic_id
        LEFT JOIN bm_bgtype b ON b.bgtype_id = po.budgettype_id
        LEFT JOIN mm_unit_generics uc ON uc.unit_generic_id = poi.unit_generic_id
        LEFT JOIN mm_units u ON u.unit_id = uc.to_unit_id 
        LEFT JOIN mm_units uu ON uu.unit_id = uc.from_unit_id 
    WHERE
        po.order_date LIKE ? 
    GROUP BY
        poi.product_id,purchase_order_id 
    ORDER BY
        po.purchase_order_number`, [_query]);
    }

    Purchasing(knex: Knex, startdate: any, enddate: any, type: any, status: any) {
        status = `%` + status + `%`;
        return knex.raw(`SELECT
        uc.qty AS conversion,
        u.unit_name AS primary_unit,
        poi.purchase_order_id,
        po.purchase_order_number,
        po.purchase_order_book_number,
        po.order_date,
        g.generic_name,
        uc.qty * poi.qty AS qty,
        muu.unit_name,
        ROUND( poi.unit_price, 2 ) AS unit_price,
        ROUND( poi.total_price, 2 ) AS total_price,
        l.labeler_name 
    FROM
        pc_purchasing_order po
        JOIN pc_purchasing_order_item poi ON poi.purchase_order_id = po.purchase_order_id
        JOIN mm_labelers l ON po.labeler_id = l.labeler_id
        JOIN mm_generics g ON poi.generic_id = g.generic_id
        LEFT JOIN bm_bgtype b ON b.bgtype_id = po.budgettype_id
        LEFT JOIN mm_unit_generics uc ON uc.unit_generic_id = poi.unit_generic_id
        LEFT JOIN mm_units u ON u.unit_id = uc.to_unit_id
        LEFT JOIN mm_units muu ON u.unit_id = uc.from_unit_id	
    WHERE
        po.order_date BETWEEN ? and ? and budget_detail_id = ? and purchase_order_status LIKE ?
    GROUP BY
        poi.product_id,purchase_order_id 
    ORDER BY
        po.purchase_order_number`, [startdate, enddate, type, status]);
    }
    name(knex: Knex, purchaRequisId) {
        let sql = `SELECT
        up.fname,
        up.lname,
        pcp.position_name,
        us.position_name as p
        FROM
        pc_purchasing_requisition_item ppri
        JOIN pc_purchasing_requisition ppr ON ppri.requisition_id = ppr.requisition_id
        JOIN mm_labelers ml ON ppr.labeler_id = ml.labeler_id
        JOIN view_generics vg ON vg.generic_id = ppri.generic_id
        JOIN bm_bgtype bb ON ppr.budgettype_id = bb.bgtype_id
        JOIN pc_committee_people pcp ON pcp.committee_id = ppr.verify_committee_id
        JOIN um_people up ON up.people_id = pcp.people_id
        JOIN um_positions us ON up.position_id=us.position_id
        WHERE ppr.requisition_id = ?
        GROUP BY pcp.people_id
        ORDER BY pcp.position_name DESC`;
        return knex.raw(sql, purchaRequisId);
    }

    async bidName(knex: Knex, id: any) {
        return knex('l_bid_process')
            .where('id', id)
    }

    async purchasing(knex: Knex, purchaOrderId) {
        return knex('pc_purchasing_order').where('purchase_order_id', purchaOrderId);
    }

    purchasingCountItem(knex: Knex, purchaOrderId) {
        let sql = `select count(poi.purchase_order_item_id) as count from pc_purchasing_order po
    join pc_purchasing_order_item poi on po.purchase_order_id=poi.purchase_order_id where po.purchase_order_id= ? `;
        return knex.raw(sql, purchaOrderId);
    }

    comma(num) {
        var number = +num
        num = number.toFixed(2);
        let deci = num.substr(num.length - 2, num.length);
        num = num.substr(0, num.length - 3);

        var l = num.toString().length
        var num2 = '';
        var c = 0;
        for (var i = l - 1; i >= 0; i--) {
            c++;
            if (c == 3 && num[i - 1] != null) { c = 0; num2 = ',' + num[i] + num2 }
            else num2 = num[i] + num2
        }
        return num2 + '.' + deci;

    }
    commaQty(num) {
        num = '' + num;
        var l = num.toString().length
        var num2 = '';
        var c = 0;
        for (var i = l - 1; i >= 0; i--) {
            c++;
            if (c == 3 && num[i - 1] != null) { c = 0; num2 = ',' + num[i] + num2 }
            else num2 = num[i] + num2
        }
        return num2;

    }
    bahtText(num) {
        var number = +num
        num = '' + number.toFixed(2);
        let deci = num.substr(num.length - 2, 2);
        num = num.substr(0, num.length - 3);
        //สร้างอะเรย์เก็บค่าที่ต้องการใช้เอาไว้
        var TxtNumArr = new Array("ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ");
        var TxtDigitArr = new Array("", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน");
        var BahtText = "";
        //ตรวจสอบดูซะหน่อยว่าใช่ตัวเลขที่ถูกต้องหรือเปล่า ด้วย isNaN == true ถ้าเป็นข้อความ == false ถ้าเป็นตัวเลข
        // num='5671';
        var num2 = num;
        var lnum = num.length;
        var cm = 0;
        num = "";
        for (var i = lnum - 1; i >= 0; i--) {
            num += num2[i];
        }
        if (lnum > 7) {
            for (var i = lnum - 1; i >= 0; i--) {

                if (i < 6) { i = -1; BahtText += TxtDigitArr[6]; cm = 1 }
                else if (num[i] == 0) {
                    if (num[i + 1] == 1 && num[i] == 0 && i == 6) { BahtText += TxtDigitArr[6]; }
                }
                else if (num[8] == 1 && num[7] == 0 && num[6] == 1 && i == 6) {
                    BahtText += TxtNumArr[1] + TxtDigitArr[6];
                    cm = 1;
                }
                else if (i == 7 && num[i] == 2) {
                    BahtText += 'ยี่' + TxtDigitArr[i - 6]
                }
                else if (i == 6 && num[i] == 1) {
                    BahtText += 'เอ็ด'
                }
                else if (i == 7 && num[i] == 1) {
                    BahtText += TxtDigitArr[i - 6];
                    cm = 1;
                }
                else
                    BahtText += TxtNumArr[num[i]] + TxtDigitArr[i - 6]
            }
        }
        var c = 1;
        for (var i = lnum - 1; i >= 0; i--) {
            if (lnum > 7 && c == 1) { i = 6; c = 0; }
            if (lnum > 7 && cm == 1) { i = 5; cm = 0 }
            if (num[i] == 0) { }
            else if (i == 1 && num[i] == 1) {
                BahtText += TxtDigitArr[i];
            }
            else if (i == 1 && num[i] == 2) {
                BahtText += 'ยี่' + TxtDigitArr[i]
            }
            else if (lnum == 1 && num[0] == 1) {
                BahtText += TxtNumArr[num[i]] + TxtDigitArr[i]
            }
            else if (i == 0 && num[i] == 1 && num[1] != 0) {
                BahtText += 'เอ็ด'
            }
            else
                BahtText += TxtNumArr[num[i]] + TxtDigitArr[i]
        }
        if (num == 0) BahtText += 'ศูนย์';
        if (deci == '0' || deci == '00') {
            BahtText += 'บาทถ้วน';
        } else {
            var deci2 = deci;
            lnum = deci.length;
            deci = '';
            for (var i = lnum - 1; i >= 0; i--) {
                deci += deci2[i];
            }
            BahtText += 'บาท';
            for (var i = lnum - 1; i >= 0; i--) {
                if (deci[i] == 0) { }
                else if (i == 1 && deci[i] == 1) {
                    BahtText += TxtDigitArr[i];
                }
                else if (i == 1 && deci[i] == 2) {
                    BahtText += 'ยี่' + TxtDigitArr[i]
                }
                // else if(1==1&&deci[0]==1){
                //     BahtText+=TxtNumArr[deci[i]]+TxtDigitArr[i]
                // }
                else if (i == 0 && deci[i] == 1 && deci[1] != 0) {
                    BahtText += 'เอ็ด'
                }
                else
                    BahtText += TxtNumArr[deci[i]] + TxtDigitArr[i]

            }
            BahtText += 'สตางค์';

        }
        return BahtText;
    }

    async getPurchasingOfficer(knex: Knex) {
        return knex('view_purchasing_officer')
    }

    async getUser(knex: Knex, userId: number) {
        return knex('view_peoples')
            .select('view_peoples.*', 'pu.user_id')
            .innerJoin('um_people_users', 'um_people_users.people_id', 'view_peoples.people_id')
            .where('pu.user_id', userId)
    }

    async getCommitteeVerify(knex: Knex, committee_id: string) {
        return knex('view_peoples')
            .select('view_peoples.*', knex.raw('concat(title_name,fname," ",lname) as fullname'), 'pc_committee_people.position_name as position')
            .innerJoin('pc_committee_people', 'pc_committee_people.people_id', 'view_peoples.people_id')
            .innerJoin('pc_committee', 'pc_committee.committee_id', 'pc_committee_people.committee_id')
            .where('pc_committee.committee_id', committee_id)
            .orderBy('pc_committee_people.position_name', 'desc')
    }


    purchasingCommittee(knex: Knex, purchaOrderId) {
        let sql = `
        SELECT
        pc.committee_id,
        pcp.people_id,
        pcp.position_name,
        ut.title_name,
        p.fname,
        p.lname,
        up.position_name as position2
        FROM
            pc_purchasing_order po
        JOIN pc_committee pc ON po.verify_committee_id = pc.committee_id
        JOIN pc_committee_people pcp ON pc.committee_id = pcp.committee_id
        JOIN um_people p ON p.people_id = pcp.people_id
        JOIN um_titles ut ON ut.title_id = p.title_id
        JOIN um_positions up ON up.position_id = p.people_id
         WHERE
        po.purchase_order_id = ? 
        ORDER BY p.position_id asc`;
        return knex.raw(sql, purchaOrderId);
    }
    purchasingCommittee2(knex: Knex, purchaOrderId) {
        let sql = `
            SELECT
            pc.committee_id,
            pcp.people_id,
            ut.title_name,
            p.fname,
            p.lname,
            up.position_name,
            pcp.position_name AS position,
            concat(
                ut.title_name,
                p.fname,
                " ",
                p.lname
            ) AS fullname
        FROM
            pc_purchasing_order po
        LEFT JOIN pc_committee pc ON po.verify_committee_id = pc.committee_id
        LEFT JOIN pc_committee_people pcp ON pc.committee_id = pcp.committee_id
        LEFT JOIN um_people p ON p.people_id = pcp.people_id
        LEFT JOIN um_titles ut ON ut.title_id = p.title_id
        LEFT JOIN um_positions up ON up.position_id = p.position_id
        WHERE
            po.purchase_order_id = ?
        ORDER BY
        pcp.committee_people_id`;
        return knex.raw(sql, purchaOrderId);
    }

    purchasingCommitteeCheck(knex: Knex, purchaOrderId) {
        let sql = `SELECT
    pc.committee_id,
    pcp.people_id,
    pcp.position_name,
    ut.title_name,
    p.fname,
    p.lname,
    up.position_name as position2
    FROM
        pc_purchasing_order po
    JOIN pc_committee pc ON po.check_price_committee_id = pc.committee_id
    JOIN pc_committee_people pcp ON pc.committee_id = pcp.committee_id
    JOIN um_people p ON p.people_id = pcp.people_id
    JOIN um_titles ut ON ut.title_id = p.title_id
    JOIN um_positions up ON up.position_id = p.people_id
    WHERE
        po.purchase_order_id = ? 
        ORDER BY p.position_id asc`;
        return knex.raw(sql, purchaOrderId);
    }

    getChief(knex: Knex, typeId) {
        //ดึงหัวหน้าเจ้าหน้าที่พัสดุ ส่ง 4 เข้ามา
        return knex.select('t.title_name as title', 'p.fname', 'p.lname', 'upos.position_name', 'upot.type_name as position')
            .from('um_purchasing_officer as upo')
            .join('um_people as p', 'upo.people_id', 'p.people_id')
            .join('um_titles as t', 't.title_id', 'p.title_id')
            .join('um_positions as upos', 'upos.position_id', 'p.position_id')
            .join('um_purchasing_officer_type as upot', 'upot.type_id', 'upo.type_id')
            .where('upo.type_id', typeId)
            .where('upo.isactive', '1')
    }
    purchasing2Chief(knex: Knex, purchaOrderId) {
        return knex.select('po.chief_id', 'po.buyer_id', knex.raw('concat(tiy.title_name,pey.fname," ",pey.lname) as buyer_fullname'), 'psy.position_name as buyer_position', knex.raw('concat(tic.title_name,pec.fname," ",pec.lname) as chief_fullname'), 'psc.position_name as chief_position')
            .from('pc_purchasing_order as po')
            .leftJoin('um_people as pey','po.buyer_id','pey.people_id')
            .leftJoin('um_titles as tiy','pey.title_id','tiy.title_id')
            .leftJoin('um_positions as psy','psy.position_id','pey.position_id')
            .leftJoin('um_people as pec','po.chief_id','pec.people_id')
            .leftJoin('um_titles as tic','pec.title_id','tic.title_id')
            .leftJoin('um_positions as psc','psc.position_id','pec.position_id')
            .where('po.purchase_order_id', purchaOrderId)
    }
    getPosition(knex: Knex, id: any) {
        return knex('um_people as up')
            .leftJoin('um_positions as upp', 'upp.position_id', 'up.position_id')
            .where('up.people_id', id)
    }
    purchasing3(knex: Knex, purchaOrderId) {
        let sql = `SELECT 
        po.purchase_order_id,
        cbp.name,
        ml.labeler_name,
        g.generic_id,
        g.generic_name,
        SUM(wp.qty) AS qty,
        poi.qty AS qtyPoi,
        poi.unit_price,
        poi.total_price,
        u.unit_name,
        po.verify_committee_id,
        po.check_price_committee_id
        FROM pc_purchasing_order po
        JOIN pc_purchasing_order_item poi ON poi.purchase_order_id=po.purchase_order_id
        JOIN mm_generics g ON poi.generic_id=g.generic_id
        LEFT JOIN mm_unit_generics ug ON g.generic_id=ug.generic_id
        LEFT JOIN mm_units u ON ug.to_unit_id=u.unit_id
        LEFT JOIN wm_products wp ON wp.product_id=poi.product_id
        LEFT JOIN mm_labelers ml ON ml.labeler_id=po.labeler_id
        LEFT JOIN l_bid_process cbp ON cbp.id=po.purchase_method
        WHERE po.purchase_order_id=?
        GROUP BY g.generic_id,poi.purchase_order_item_id`;
        return knex.raw(sql, purchaOrderId);
    }
    purchasing4(knex: Knex, purchaOrderId) {
        return knex.select().from('pc_purchasing_order as po')
            .join('pc_purchasing_order_item as poi', 'po.purchase_order_id', 'poi.purchase_order_id')
            .join('mm_products as mp', 'mp.product_id', 'poi.product_id')
            .join('mm_labelers as ml', 'ml.labeler_id', 'po.labeler_id')
            .where('po.purchase_order_id', purchaOrderId)
    }
    purchasing5(knex: Knex, purchaOrderId) {
        return knex.select().from('pc_purchasing_order as po')
            .join('pc_purchasing_order_item as poi', 'po.purchase_order_id', 'poi.purchase_order_id')
            .join('mm_products as mp', 'mp.product_id', 'poi.product_id')
            .join('mm_labelers as ml', 'ml.labeler_id', 'po.labeler_id')
            .where('po.purchase_order_id', purchaOrderId)
    }
    purchasing8(knex: Knex, purchaOrderId) {
        return knex.select().from('pc_purchasing_order as po')
            .join('pc_purchasing_order_item as poi', 'po.purchase_order_id', 'poi.purchase_order_id')
            .join('mm_products as mp', 'mp.product_id', 'poi.product_id')
            .join('mm_labelers as ml', 'ml.labeler_id', 'po.labeler_id')
            .where('po.purchase_order_id', purchaOrderId)
    }
    purchasing9(knex: Knex, startdate, enddate) {
        return knex.raw(`SELECT
    po.purchase_order_id,
    poi.generic_id,
    vp.product_name,
    vp.generic_name,
    ROUND(poi.unit_price,2) AS unit_price,
    poi.qty,
    mup.qty as qty1,
    mu.unit_name,
    ROUND(poi.total_price,2) AS total_price,
    ml.labeler_name
    FROM pc_purchasing_order po
    JOIN pc_purchasing_order_item poi ON po.purchase_order_id=poi.purchase_order_id
    JOIN view_products vp ON vp.generic_id=poi.generic_id
    JOIN mm_labelers ml ON ml.labeler_id=po.labeler_id
    JOIN mm_unit_products mup ON mup.unit_product_id=poi.unit_product_id
    JOIN mm_units mu ON mu.unit_id=mup.to_unit_id
    WHERE po.created_date BETWEEN ? AND ? ORDER BY po.created_date`, [startdate, enddate]);
    }
    purchasing10(knex: Knex, purchaOrderId) {
        let sql = `SELECT
        mp.product_name,
        mup.qty as conversion, 
        muu.unit_name as primary_unit,
        po.delivery,
        ml.address,
        ml.phone,
        ml.nin,
        po.purchase_order_id,
        po.purchase_order_number,
        po.purchase_method,
        po.purchase_order_book_number,
        cbp. NAME as bname,
        cbt.bid_name,
        cbt.bid_id,
        ml.labeler_name,
        mg.generic_id,
        mg.generic_name,
        FLOOR(( IF ( SUM( wp.qty ) IS NULL, 0, SUM( wp.qty ) ) ) / mup.qty) AS qty,
        poi.qty AS qtyPoi,
        poi.unit_price,
        poi.total_price,
        mu.unit_name,
        po.verify_committee_id,
        po.check_price_committee_id,
        po.budget_detail_id
       FROM
           pc_purchasing_order po
       LEFT JOIN pc_purchasing_order_item poi ON poi.purchase_order_id = po.purchase_order_id
       LEFT JOIN mm_generics mg ON poi.generic_id = mg.generic_id
       LEFT JOIN mm_unit_generics mup ON mup.unit_generic_id = poi.unit_generic_id
       LEFT JOIN mm_units muu on muu.unit_id = mg.primary_unit_id
       LEFT JOIN mm_units mu ON mu.unit_id = mup.from_unit_id
       LEFT JOIN wm_products wp ON wp.product_id = poi.product_id
       LEFT JOIN mm_labelers ml ON ml.labeler_id = po.labeler_id
       LEFT JOIN l_bid_process cbp ON cbp.id = po.purchase_method
       LEFT JOIN l_bid_type cbt ON cbt.bid_id = po.purchase_type
       LEFT JOIN mm_products mp on mp.generic_id = mg.generic_id
       WHERE po.purchase_order_id=? AND mg.generic_id IS NOT NULL
       GROUP BY
           poi.generic_id`
        return knex.raw(sql, purchaOrderId)
    }
    p10Committeeleader(knex: Knex) {
        let sql = `SELECT
            pc.committee_id,
            pcp.people_id,
            pcp.position_name,
            ut.title_name,
            p.fname,
            p.lname,
            up.position_name AS position2
        FROM
            pc_purchasing_order po
        JOIN pc_committee pc ON po.verify_committee_id = pc.committee_id
        JOIN pc_committee_people pcp ON pc.committee_id = pcp.committee_id
        JOIN um_people p ON p.people_id = pcp.people_id
        JOIN um_titles ut ON ut.title_id = p.title_id
        JOIN um_positions up ON up.position_id = p.people_id
        WHERE pcp.position_name='ประธาน'
        GROUP BY p.fname
        ORDER BY pcp.position_name
        LIMIT 1`;
        return knex.raw(sql);
    }
    p10Committee(knex: Knex) {
        let sql = `SELECT
            pc.committee_id,
            pcp.people_id,
            pcp.position_name,
            ut.title_name,
            p.fname,
            p.lname,
            up.position_name AS position2
        FROM
            pc_purchasing_order po
        JOIN pc_committee pc ON po.verify_committee_id = pc.committee_id
        JOIN pc_committee_people pcp ON pc.committee_id = pcp.committee_id
        JOIN um_people p ON p.people_id = pcp.people_id
        JOIN um_titles ut ON ut.title_id = p.title_id
        JOIN um_positions up ON up.position_id = p.people_id
        WHERE pcp.position_name='กรรมการ'
        GROUP BY p.fname
        ORDER BY pcp.position_name
        LIMIT 2`;
        return knex.raw(sql);
    }
    purchasing11(knex: Knex, startdate: any, enddate: any) {
        return knex('pc_purchasing_order')
            .select('purchase_order_id')
            .whereBetween('order_date', [startdate, enddate])
    }
    getSumTotal(knex: Knex, bgdetail: any) {
        let sql = `SELECT
        sum(total_price) as sum
        FROM
        pc_purchasing_order po
        left JOIN bm_budget_detail bd ON bd.bgdetail_id=po.budget_detail_id
        WHERE bd.bgdetail_id=?`
        return knex.raw(sql, [bgdetail]);
    }
    sumType1(knex: Knex, smonth: any, emonth: any) {
        let sql = `SELECT
        mga.account_name,
        IF(po.order_date BETWEEN ? AND ?,SUM(poi.total_price),0) AS total_price
        FROM pc_purchasing_order po 
        JOIN pc_purchasing_order_item poi ON po.purchase_order_id=poi.purchase_order_id
        JOIN mm_generics mg ON mg.generic_id=poi.generic_id
        JOIN mm_generic_accounts mga ON mga.account_id=mg.account_id
        GROUP BY mga.account_id
        ORDER BY mga.account_id
        `
        return knex.raw(sql, [smonth, emonth])
    }
    sumType2(knex: Knex, smonth: any, emonth) {
        let sql = `SELECT
        mgt.generic_type_name,
        IF(po.order_date BETWEEN ? AND ?,SUM(poi.total_price),0) AS total_price
        FROM mm_generic_types mgt
        LEFT JOIN mm_generics mg ON mgt.generic_type_id=mg.generic_type_id
        LEFT JOIN pc_purchasing_order_item poi ON mg.generic_id=poi.generic_id
        LEFT JOIN pc_purchasing_order po ON po.purchase_order_id=poi.purchase_order_id
        WHERE mgt.generic_type_id != 1
        GROUP BY mgt.generic_type_id
        ORDER BY mgt.generic_type_id
        `
        return knex.raw(sql, [smonth, emonth])
    }

    pcBudget(knex: Knex, purchaOrderId) {
        return knex('pc_budget_transection')
            .where('purchase_order_id', [purchaOrderId])
            .andWhere('type', 'spend')
    }

    getProductHistory(knex: Knex, generic_id: string) {
        let sql = `SELECT
        po.purchase_order_number,
        mp.working_code AS trading_code,
        mp.product_name,
        pp.qty,
        mu.unit_name AS large_unit_name,
        mug.qty AS conversion_qty,
        mmu.unit_name AS small_large_unit_name,
        pp.unit_price,
        pp.total_price,
        po.contract_id
      FROM
        mm_generics AS mg
      JOIN pc_purchasing_order_item AS pp ON mg.generic_id = pp.generic_id
      JOIN pc_purchasing_order AS po ON pp.purchase_order_id = po.purchase_order_id
      JOIN mm_products AS mp ON pp.product_id = mp.product_id
      JOIN mm_unit_generics AS mug ON pp.unit_generic_id = mug.unit_generic_id
      JOIN mm_units AS mu ON mug.from_unit_id = mu.unit_id
      JOIN mm_units AS mmu ON mug.to_unit_id = mmu.unit_id
      WHERE
        pp.generic_id = '${generic_id}'
      AND
        pp.giveaway = 'N'
        `
        return (knex.raw(sql))
      }
    allAmountTransaction(knex: Knex, bgdetail_id: any, budgetYear: any) {
        return knex('pc_budget_transection')
            .where('bgdetail_id', [bgdetail_id])
            .andWhere('budget_year', [budgetYear])
            .andWhere('type', 'spend')
    }
}
