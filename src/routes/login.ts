'use strict';

import * as express from 'express';
import * as crypto from 'crypto';

import { Jwt } from '../models/jwt';
import { LoginModel } from '../models/login';

const router = express.Router();
const jwt = new Jwt();
const loginModel = new LoginModel();

router.post('/', (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;

  if (username && password) {
    let encPassword = crypto.createHash('md5').update(password).digest('hex');
    let db = req.db;
    loginModel.doLogin(db, username, encPassword)
      .then((results: any) => {
        if (results.length) {
          res.send({ ok: false, error: 'กรุณา login ผ่าน login portal' });
        } else {
          res.send({ ok: false, error: 'ชื่อผู้ใช้งานหรือรหัสผ่าน ไม่ถูกต้อง' })
        }
      })
      .catch(err => {
        console.log(err);
        res.send({ ok: false, error: 'Server error!' });
      })
      
  } else {
    res.send({ ok: false, error: 'กรุณาระบุชื่อผู้ใช้งานและรหัสผ่าน' })
  }
})

export default router;