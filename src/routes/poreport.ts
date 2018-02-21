'use strict';

import * as express from 'express';
import * as moment from 'moment';
import * as fse from 'fs-extra';
import * as wrap from 'co-express';
import * as _ from 'lodash';
import { PurchasingOrderReportModel } from '../models/reports/purchasingOrder';
import { RequisitionOrderReportModel } from '../models/reports/requisitionOrder';

const router = express.Router();

router.get('/default',wrap(async (req, res, next) => {
    let db = req.db;
    moment.locale('th');
    res.render('templates/reports/default', {
    });
  }));

  export default router;