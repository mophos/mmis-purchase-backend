'use strict';

import * as express from 'express';
import * as moment from 'moment';

import { EdiModel } from '../models/edi';
import { PurchasingOrderReportModel } from '../models/reports/purchasingOrder';
const poModel = new PurchasingOrderReportModel();
const router = express.Router();

const ediModel = new EdiModel();

router.get('/settings', async (req, res, next) => {
  const db = req.db;
  const actionName = req.query.actionName;
  try {
    const rs: any = await ediModel.getSetting(db, actionName);
    if (rs.length) {
      res.send({ ok: true, rows: rs[0].value });
    } else {
      res.send({ ok: false, error: 'ไม่พบข้อมูล' });
    }
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/settings', async (req, res, next) => {
  const db = req.db;
  const value = req.body.value;
  try {
    await ediModel.saveSetting(db, value);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/create', async (req, res, next) => {
  try {
    const db = req.db;
    let sys_hospital = req.decoded.SYS_HOSPITAL;
    const hospcode = JSON.parse(sys_hospital).hospcode;
    const hospname = JSON.parse(sys_hospital).hospname;


    const purchasingOrderId = req.body.purchasingOrderId;
    const settings: any = await ediModel.getSetting(db, 'TOKEN');
    if (settings[0].value) {
      for (const p of purchasingOrderId) {
        const obj: any = {};
        let header: any = await ediModel.getHeaderEDI(db, p.purchase_order_id);
        header = header[0];
        obj.token = settings[0].value;
        obj.file_info = {};
        obj.file_info.data_line_type = 'FL'; // ใส่ค่าคงที่ 'FL'
        obj.file_info.file_code = 'PO_IN'; // ใส่ค่า 'PO_IN'
        obj.file_info.total_records = header[0].total_records; // Line Detail Count

        obj.header = {};
        obj.header.data_line_type = 'HD'; // ใส่ค่าคงที่ 'HD'
        obj.header.po_no = header[0].purchase_order_number; // หมายเลขใบสั่งซื้อ 
        obj.header.po_type = header[0].po_type; // ประเภทใบสั่งซื้อ (0: ไม่ติดสัญญา, 1:  ติดสัญญา)
        obj.header.contract_no = header[0].contract_ref; // เลขที่สัญญา 
        obj.header.ordered_date = moment(header[0].order_date).format('YYYY-MM-DD'); // วันที่สั่งซื้อ (Date) 
        // obj.header.delivery_date = ''; // วันที่ส่งสินค้า (Date) 
        obj.header.hosp_code = hospcode; // รหัสโรงพยาบาล
        obj.header.hosp_name = hospname; // ชื่อโรงพยาบาล
        obj.header.buyer_name = header[0].buyer_name; // ชื่อผู้สั่งซื้อ  
        obj.header.buyer_dept = header[0].warehouse_name; // แผนกผู้สั่งซื้อ 
        // obj.header.email = ''; // Email Address
        obj.header.supplier_code = header[0].labeler_code_edi; // รหัสผู้จำหน่าย/ผู้ผลิต 
        obj.header.ship_to_code = hospcode; // รหัส Ship_to 
        obj.header.bill_to_code = hospcode; // รหัส Bill_to  
        obj.header.approval_code = '-'; // รหัสผู้รับแจ้งหนี้*
        obj.header.budget_code = header[0].budget_detail_id; // รหัสงบประมาณ
        obj.header.currency_code = 'THB'; // สกุลเงินที่จัดซื้อ 
        obj.header.payment_term = ''; // เงื่อนไขการชำระเงิน 
        obj.header.discount_pct = header[0].discount_percent == null ? 0 : header[0].discount_percent;; // ส่วนลด % 
        obj.header.total_amount = header[0].total_price; // ยอดรวมเงินทั้ง PO 
        obj.header.note_to_supplier = ''; // หมายเหตุ ถึง ผู้จำหน่าย/ผู้ผลิต 
        obj.header.resend_flag = 'NEW'; // ส่งข้อมูล PO ซ้ำไปแทนที่ใบเดิม  (Refer PO No.)
        obj.header.creation_date = moment().format('YYYY-MM-DD'); // วัน/เวลา ที่สร้างข้อมูล (Date/Time) 
        obj.header.quotation_no = ''; // รหัสใบเสนอราคา
        obj.header.customer_id = ''; // รหัสลูกค้า (GPO)
        obj.header.last_interfaced_date = moment().format('YYYY-MM-DD HH:mm:ss'); // system Value 
        obj.header.interface_id = '-';  // system Value 
        obj.line = [];
        let detail: any = await ediModel.getDetailEDI(db, p.purchase_order_id);
        detail = detail[0];
        let no = 0;
        for (const v of detail) {
          no++;
          const line: any = {};
          line.data_line_type = 'LN'; // ใส่ค่าคงที่ 'LN'
          line.line_no = no; // ลำดับรายการ 
          line.hosp_item_code = v.working_code; // *รหัสยาของโรงพยาบาล
          line.hosp_item_name = v.product_name; // *ชื่อยาของโรงพยาบาล
          line.dist_item_code = v.edi_labeler_code; // *รหัสยาของผู้จัดจำหน่าย
          line.pack_size_desc = `${v.large_unit} (${v.conversion_qty} ${v.small_unit})`;
          line.ordered_qty = v.qty;
          line.uom = v.large_unit;
          line.price_per_unit = v.unit_price;
          line.line_amount = v.total_price;
          line.discount_line_item = v.discount_percent == null ? 0 : v.discount_percent;
          line.urgent_flag = 0;
          line.comment = '';
          obj.line.push(line);
        }
        console.log(obj);
        const rs = await ediModel.sendEDI(obj);
        console.log(rs);

      }
      res.send({ ok: true });
    } else {
      res.send({ ok: false, error: ' ไม่มี TOKEN สำหรับการสั่งซื้อออนไลน์' });
    }

  } catch (error) {
    console.log(error);
    res.send({ ok: false, error: error });
  }
});
export default router;