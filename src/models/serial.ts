import Knex = require('knex');
import * as moment from 'moment';

export class SerialModel {
  getSerialInfo(knex: Knex, srType: string) {
    return knex('sys_serials as sr')
      .where('sr.sr_type', srType)
      .select('sr.sr_no', 'sr.sr_prefix', 'is_year_prefix', 'sr.digit_length', 'sf.serial_code')
      .leftJoin('sys_serial_format as sf', 'sf.serial_format_id', 'sr.serial_format_id')
      .limit(1);
  }

  getSerialNumber(knex: Knex, year, genericTypeId) {
    return knex('pc_purchasing_order')
      .select(knex.raw('count(year(order_date)) as total'))
      .whereRaw(`( YEAR ( order_date ) = '${year - 1}' AND MONTH ( order_date ) >= '10' )
      OR ( YEAR ( order_date ) = '${year}' AND MONTH ( order_date ) <= '9' ) and generic_type_id = '${genericTypeId}'`)
  }

  getWarehouseName(knex: Knex, warehouseId) {
    let sql = `SELECT
    SUBSTR( purchase_order_number, 7, 2 ) as warehouse_no
    FROM
      pc_purchasing_order 
    WHERE
      warehouse_id = '${warehouseId}' 
    GROUP BY
      SUBSTR( purchase_order_number, 7, 2 )
      
      UNION ALL
      
        select LPAD(count(*)+1,2,'0')  as warehouse_no from (
    SELECT
      * 
    FROM
      pc_purchasing_order 
    GROUP BY
      warehouse_id) as a
      limit 1`;
    return knex.raw(sql);
  }
  async getSerial(knex: Knex, srType: string, year, no) {

    let serialInfo = await this.getSerialInfo(knex, srType);

    if (serialInfo.length) {
      let currentNo = serialInfo[0].sr_no;
      let serialCode = serialInfo[0].serial_code;
      let serialLength = serialInfo[0].digit_length;
      let serialPrefix = serialInfo[0].sr_prefix;
      let serialYear = moment().get('year') + 543;
      let _serialYear = serialYear.toString().substring(2);
      let newSerialNo = this.paddingNumber(currentNo, serialLength);

      let sr: any = null;

      if (serialInfo[0].is_year_prefix === 'Y') {
        sr = serialCode.replace('PREFIX', serialPrefix).replace('YY', _serialYear).replace('##', newSerialNo);
      } else {
        sr = serialCode.replace('PREFIX', serialPrefix).replace('##', newSerialNo);
      }

      // update serial
      await this.updateSerial(knex, srType);

      // return serial
      return sr;

    } else {
      return '000000';
    }
  }

  async getSerialNew(knex: Knex, srType: string, year, no, warehouseId = null) {
    let serialInfo = await this.getSerialInfo(knex, srType);
    let warehouseNo = await this.getWarehouseName(knex, warehouseId);
    warehouseNo = warehouseNo[0];
    if (serialInfo.length) {
      // let currentNo = serialInfo[0].sr_no;
      let serialCode = serialInfo[0].serial_code;
      let serialLength = serialInfo[0].digit_length;
      let serialPrefix = serialInfo[0].sr_prefix;
      let currentNo = no;
      let serialYear = year + 543;
      let _serialYear = serialYear.toString().substring(2);
      let newSerialNo = this.paddingNumber(currentNo, serialLength);
      let _warehouseNo = this.paddingNumber(warehouseNo[0].warehouse_no, 2);
      let sr: any = null;

      if (serialInfo[0].is_year_prefix === 'Y') {
        sr = serialCode.replace('PREFIX', serialPrefix).replace('YY', _serialYear).replace('WW', _warehouseNo).replace('##', newSerialNo);
      } else {
        sr = serialCode.replace('PREFIX', serialPrefix).replace('WW', _warehouseNo).replace('##', newSerialNo);
      }

      // return serial
      return sr;

    } else {
      return '000000';
    }
  }

  async getSerialWithoutUpdate(knex: Knex, srType: string) {

    let serialInfo = await this.getSerialInfo(knex, srType);
    // update serial
    await this.updateSerial(knex, srType);

    if (serialInfo.length) {
      let currentNo = serialInfo[0].sr_no;
      let serialCode = serialInfo[0].serial_code;
      let serialLength = serialInfo[0].digit_length;
      let serialPrefix = serialInfo[0].sr_prefix;
      let serialYear = moment().get('year') + 543;
      let _serialYear = serialYear.toString().substring(2);
      let newSerialNo = this.paddingNumber(currentNo, serialLength);

      let sr: any = null;

      if (serialInfo[0].is_year_prefix === 'Y') {
        sr = serialCode.replace('PREFIX', serialPrefix).replace('YY', _serialYear).replace('##', newSerialNo);
      } else {
        sr = serialCode.replace('PREFIX', serialPrefix).replace('##', newSerialNo);
      }
      // return serial
      return sr;

    } else {
      return '000000';
    }
  }

  paddingNumber(n: number, p: number) {
    var pad_char = '0';
    var pad = new Array(1 + p).join(pad_char);
    return (pad + n).slice(-pad.length);
  }

  async updateSerial(knex: Knex, srType: string) {
    return knex('sys_serials')
      .increment('sr_no', 1)
      .where('sr_type', srType);
  }

}