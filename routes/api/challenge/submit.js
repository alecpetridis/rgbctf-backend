const express = require('express');
const debug = require('debug')('rgbctf-backend');
const createError = require('http-errors');
const Joi = require('@hapi/joi');
const Challenge = require('../../../models/challenge');

const router = express.Router();

const requestSchema = Joi.object({
  name: Joi.string().required(),
  flag: Joi.string().required(),
});

router.post('/', async (req, res, next) => {
  const validatedBody = requestSchema.validate(req.body);
  if (validatedBody.error) {
    next(createError(400, 'Invalid Payload'));
    return;
  }

  if (!req.team._id) {
    next(createError(403, 'Unauthorized'));
    return;
  }

  const {
    name, flag,
  } = validatedBody.value;

  if (req.team.solves.includes(name)) {
    next(createError(422, 'Already Solved'));
    return;
  }

  let chall;
  try {
    chall = await Challenge.findOne({ name }, 'name flag flagCaseSensitive');
  } catch (err) {
    debug(`challenge/submit: err: ${err.message}`);
    next(createError(500, 'Internal Error'));
    return;
  }

  if (!chall) {
    next(createError(404, 'Challenge Not Found'));
    return;
  }
  let correctFlag = chall.flag;
  let submittedFlag = flag;

  if (!chall.flagCaseSensitive) {
    correctFlag = correctFlag.toLowerCase();
    submittedFlag = submittedFlag.toLowerCase();
  }

  if (correctFlag === submittedFlag) {
    req.team.solves.push(chall.name);
    try {
      req.team.save();
    } catch (err) {
      debug(`challenge/submit team/save: err: ${err.message}`);
      next(createError(500, 'Internal Error'));
      return;
    }

    res.apiRes('correct flag');
  } else {
    next(createError(403, 'Wrong Flag'));
  }
});

module.exports = router;
