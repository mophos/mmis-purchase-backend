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

router.get('/getPurchasingOfficer', (req, res, next) => {
  let db = req.db;
  officerModel.getPurchasingOfficer(db)
    .then((results: any) => {
      res.send({ ok: true, rows: results });
    })
    .catch(error => {
      res.send({ ok: false, error: error });
    });
});

router.get('/getPeoples', (req, res, next) => {
  let db = req.db;
  officerModel.getPeoples(db)
    .then((results: any) => {
      res.send({ ok: true, rows: results });
    })
    .catch(error => {
      res.send({ ok: false, error: error });
    });
});

router.get('/getPurchasingOfficerType', (req, res, next) => {
  let db = req.db;

  officerModel.getPurchasingOfficerType(db)
    .then((results: any) => {
      res.send({ ok: true, rows: results });
    })
    .catch(error => {
      res.send({ ok: false, error: error });
    });
});

router.post('/savePurchasingOfficer', (req, res, next) => {
  let db = req.db;
  let data = req.body.data;
  officerModel.savePurchasingOfficer(db, data)
    .then((results: any) => {
      res.send({ ok: true, rows: results });
    })
    .catch(error => {
      res.send({ ok: false, error: error });
    });
});

router.put('/updatePurchasingOfficer', (req, res, next) => {
  let db = req.db;
  let data = req.body.data;
  let officerId = req.body.officerId;
  officerModel.updatePurchasingOfficer(db, officerId, data)
    .then((results: any) => {
      res.send({ ok: true, rows: results });
    })
    .catch(error => {
      res.send({ ok: false, error: error });
    });
});

router.post('/deletePurchasingOfficer', (req, res, next) => {
  let ref = req.body.ref;
  let db = req.db;
  let tokenKey: string = req.body.tokenKey;
  if (tokenKey === "") {
    res.send({ ok: false, err: 'token error' });
  }
  if (!ref || ref < 0) {
    res.send({ ok: false, err: 'reference not found' });
  }

  officerModel.deletePurchasingOfficer(db, ref)
    .then((results: any) => {
      res.send({ ok: true, ref: results[0] });
    })
    .catch(error => {
      console.log({ ok: false, error: error });
      res.send({ ok: false, error: error });
    });
});

router.delete('/:officerId', (req, res, next) => {
  let db = req.db;
  let officerId: string = req.params.officerId;
  officerModel.deleteOfficer(db, officerId)
    .then((results: any) => {
      res.send({ ok: true, ref: results[0] });
    })
    .catch(error => {
      console.log({ ok: false, error: error });
      res.send({ ok: false, error: error });
    });
});
export default router;