'use strict';

import * as express from 'express';
import * as moment from 'moment';
import * as wrap from 'co-express';
import { OfficerModel } from '../models/officer';

const router = express.Router();

const officerModel = new OfficerModel();


router.get('/', wrap(async (req, res, next) => {
  let db = req.db;
  try {
    let detail = await officerModel.getSetting(db);
    res.send({ ok: true, detail: detail[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
}));

router.post('/get-sys-setting', wrap(async (req, res, next) => {
  let actionName = req.body.actionName;
  let hospcode = req.body.hospcode;

  let db = req.db;

  officerModel.getSysSetting(db, actionName)
    .then((results: any) => {
      console.log('get sys_setting: ' + actionName + ' founded ' + results.length + 'rows');
      res.send({ ok: true, rows: results });
    })
    .catch(error => {
      console.log('get sys_setting: ' + actionName + ' fail ');
      res.send({ ok: false, error: error })
    });
}));

router.post('/save-settings', wrap(async (req, res, next) => {
  let varName = req.body.varName;
  let dataValue = req.body.dataValue;
  let hospcode = req.body.hospcode;

  let db = req.db;

  officerModel.saveSysSettings(db, varName, dataValue)
    .then((results: any) => {
      console.log('save sys_setting: ' + varName + '=' + dataValue + ' success ');
      res.send({ ok: true, rows: results });
    })
    .catch(error => {
      console.log('save sys_setting: ' + varName + '=' + dataValue + ' fail ');
      res.send({ ok: false, error: error })
    });
}));

router.post('/', wrap(async (req, res, next) => {
  let data = req.body.data;
  let hospcode = data.hospcode;
  let hospname = data.hospname;
  let address = data.address;
  let fax = data.fax;
  let telephone = data.telephone;
  let taxId = data.taxId;
  let managerName = data.managerName;

  let db = req.db;

  if (hospcode && hospname && address && managerName) {
    let datas: any = {
      hospcode: hospcode,
      hospname: hospname,
      address: address,
      fax: fax,
      telephone: telephone,
      tax_id: taxId,
      manager_name: managerName
    }

    try {
      await officerModel.remove(db);
      await officerModel.save(db, datas);
      await officerModel.saveSysSettings(db, 'SYS_HOSPITAL', JSON.stringify(data));
      res.send({ ok: true });
    } catch (error) {
      res.send({ ok: false, error: error.message })
    } finally {
      db.destroy();
    }
  } else {
    res.send({ ok: false, error: 'ข้อมูลไม่สมบูรณ์' });
  }
}));
router.post('/selectData', (req, res, next) => {
  let tableName = req.body.tableName;
  let selectText = req.body.selectText;
  let whereText = req.body.whereText;
  let groupBy = req.body.groupBy;
  let orderText = req.body.orderText;
  let db = req.db;
  let tokenKey: string = req.body.tokenKey;
  if (tokenKey === "") {
      res.send({ ok: false, err: 'token error' });
  }

  officerModel.selectSql(db, tableName, selectText, whereText, groupBy, orderText)
      .then((results: any) => {
          console.log("\nget: " + tableName + ' = ' + results[0].length + ' record<s> founded.');
          res.send({ ok: true, rows: results[0] });
      })
      .catch(error => {
          res.send({ ok: false, error: error })
      });
});
router.post('/getPurchasingOfficer', (req, res, next) => {
  let ref = req.body.ref;
  let db = req.db;
  let tokenKey: string = req.body.tokenKey;
  console.log("\nget: um_purchasing_officer ref:" + ref);
  if (tokenKey === "") {
      res.send({ ok: false, err: 'token error' });
  }

  officerModel.getPurchasingOfficer(db, ref)
      .then((results: any) => {
          console.log("\nget um_purchasing_officer =" + results.length);
          res.send({ ok: true, rows: results });
      })
      .catch(error => {
          console.log({ ok: false, error: error });
          res.send({ ok: false, error: error });
      });
});

router.post('/savePurchasingOfficer', (req, res, next) => {
  let ref = req.body.ref;
  let datas = req.body.data;
  let db = req.db;
  let tokenKey: string = req.body.tokenKey;
  console.log("\nsave: um_purchasing_officer ref:" + ref);
  if (tokenKey === "") {
      res.send({ ok: false, err: 'token error' });
  }

  officerModel.savePurchasingOfficer(db, ref, datas)
      .then((results: any) => {
          console.log("\nsave result: um_purchasing_officer ref:" + results[0]);
          res.send({ ok: true, ref: results[0] });
      })
      .catch(error => {
          console.log({ ok: false, error: error });
          res.send({ ok: false, error: error });
      });
});

router.post('/deletePurchasingOfficer', (req, res, next) => {
  let ref = req.body.ref;
  let db = req.db;
  let tokenKey: string = req.body.tokenKey;
  console.log("\ndelete: um_purchasing_officer ref:" + ref);
  if (tokenKey === "") {
      res.send({ ok: false, err: 'token error' });
  }
  if (!ref || ref < 0) {
      res.send({ ok: false, err: 'reference not found' });
  }

  officerModel.deletePurchasingOfficer(db, ref)
      .then((results: any) => {
          console.log("\ndelete um_purchasing_officer =" + results[0]);
          res.send({ ok: true, ref: results[0] });
      })
      .catch(error => {
          console.log({ ok: false, error: error });
          res.send({ ok: false, error: error });
      });
});
export default router;