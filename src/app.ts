/// <reference path="../typings.d.ts"/>
import * as path from 'path';
let envPath = path.join(__dirname, '../../mmis-config');
require('dotenv').config(({ path: envPath }));

import * as express from 'express';
import * as favicon from 'serve-favicon';
import * as logger from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

const protect = require('@risingstack/protect');af
import expressValidator = require('express-validator');
import * as Knex from 'knex';
import { MySqlConnectionConfig } from 'knex';
import { Jwt } from './models/jwt';
const jwt = new Jwt();

import indexRoute from './routes/index';
import loginRoute from './routes/login';

import peopleRoute from './routes/people';
import committeeRoute from './routes/committee';
import purchasingRoute from './routes/purchasing';
import purchasingOrderRoute from './routes/purchasingOrder';
import purchasingOrderItemRoute from './routes/purchasingOrderItem';
import productRoute from './routes/product';
import committeePeopleRoute from './routes/committeePeople';
import contractProductRoute from './routes/contractProduct';

import budgetTypeRoute from './routes/budgetType';
import bidTypeRoute from './routes/bidType';
import labelerRoute from './routes/labeler';
import requisitionRoute from './routes/requisition';
import requisitionItemRoute from './routes/requisitionItem';
import packageRoute from './routes/package';
import contractRoute from './routes/contract';
import reportOrderRoute from './routes/reports/order';
import reportRoute from './routes/report';
import poReportRoute from './routes/poreport';
import bidProcessRoute from './routes/bidProcess';
import holidaysRoute from './routes/holidays';
import unitRoute from './routes/unit';
import genericTypeRoute from './routes/genericType';
import settingRoute from './routes/setting';
import budgetTransectionRoute from './routes/budgetTransection';
import userRoute from './routes/users';
import stdRoute from './routes/standard';
import officerRoute from './routes/officer'
import ediRoute from './routes/edi';
import egpRoute from './routes/reports/egp'
import poRoute from './routes/reports/po'
import pafRoute from './routes/reports/paf'
import gpoRoute from './routes/reports//gpo'
const app: express.Express = express();

//view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());
app.use(expressValidator());

// app.use(protect.express.sqlInjection({
//   body: true,
//   loggerFunction: console.error
// }));

app.use(protect.express.xss({
  body: true,
  loggerFunction: console.error
}));

let checkAuth = (req, res, next) => {
  let token: string = null;

  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else {
    token = req.body.token;
  }

  jwt.verify(token)
    .then((decoded: any) => {
      req.decoded = decoded;
      next();
    }, err => {
      return res.send({
        ok: false,
        error: 'No token provided.',
        code: 403
      });
    });
}

let dbConnection: MySqlConnectionConfig = {
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
}

app.use((req, res, next) => {
  req.db = Knex({
    client: 'mysql',
    connection: dbConnection,
    pool: {
      min: 0,
      max: 7,
      create: (conn, done) => {
        conn.query('SET NAMES utf8', (err) => {
          done(err, conn);
        });
      }
    },
    debug: true,
    acquireConnectionTimeout: 10000
  });

  next();
});

app.use('/login', loginRoute);

app.use('/users', checkAuth, userRoute);
app.use('/people', checkAuth, peopleRoute);
app.use('/committee', checkAuth, committeeRoute);
app.use('/purchasing', checkAuth, purchasingRoute);
app.use('/purchasing-order', checkAuth, purchasingOrderRoute);
app.use('/purchasing-orderitem', checkAuth, purchasingOrderItemRoute);
app.use('/products', checkAuth, productRoute);
app.use('/committee-people', checkAuth, committeePeopleRoute);
app.use('/budgettype', checkAuth, budgetTypeRoute);
app.use('/bidtype', checkAuth, bidTypeRoute);
app.use('/labeler', checkAuth, labelerRoute);
app.use('/package', checkAuth, packageRoute);
app.use('/requisition', checkAuth, requisitionRoute);
app.use('/contracts', checkAuth, contractRoute);
app.use('/requisitionitem', checkAuth, requisitionItemRoute);
app.use('/contract-product', checkAuth, contractProductRoute);
app.use('/bid-process', checkAuth, bidProcessRoute);
app.use('/unit', checkAuth, unitRoute);
app.use('/holidays', checkAuth, holidaysRoute);
app.use('/report', reportRoute);
app.use('/generictype', genericTypeRoute);
app.use('/setting', settingRoute);
app.use('/docs', poReportRoute);
app.use('/budget-transection', budgetTransectionRoute);
app.use('/std', stdRoute);
app.use('/officer', checkAuth, officerRoute);
app.use('/edi', checkAuth, ediRoute);


//report
app.use('/report/egp', checkAuth, egpRoute);
app.use('/report/po', checkAuth, poRoute);
app.use('/report/paf', checkAuth, pafRoute);
app.use('/report/gpo', checkAuth, gpoRoute);

app.use('/', checkAuth, indexRoute);

//catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err['status'] = 404;
  next(err);
});

app.use((err: Error, req, res, next) => {
  res.status(err['status'] || 500);
  console.log(err);
  res.send({ ok: false, error: err });
});

export default app;
