'use strict';

import * as express from 'express';
import * as moment from 'moment';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as Random from 'random-js';
import * as json2xls from 'json2xls';
import * as wrap from 'co-express';
import * as _ from 'lodash';

import { PurchasingOrderReportModel } from '../../models/reports/purchasingOrder';
import { RequisitionOrderReportModel } from '../../models/reports/requisitionOrder';
import { CommitteeModel } from './../../models/committee';
import { PurchasingOrderModel } from './../../models/purchasingOrder';
import { PurchasingModel } from '../../models/purchasing';
import { RequisitionModel } from '../../models/requisition';
import { RequisitionItemModel } from '../../models/requisitionItem';
import { LabelerModel } from '../../models/labeler';
import { CommitteePeopleModel } from './../../models/committeePeople';

const router = express.Router();
const model = new PurchasingOrderReportModel();
const modelPr = new RequisitionOrderReportModel();


export default router;