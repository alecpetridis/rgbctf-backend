const express = require('express');
const debug = require('debug')('rgbctf-backend');
const createError = require('http-errors');
const Challenge = require('../../../models/challenge');

const router = express.Router();

router.get('/', async (req, res, next) => {
  if (!req.team._id) {
    next(createError(403, 'Unauthorized'));
    return;
  }

  let docs;
  try {
    docs = await Challenge.find({});
  } catch (err) {
    debug(`challenge/list: err: ${err.message}`);
    next(createError(500, 'Internal Error'));
    return;
  }

  const challenges = docs.map((challenge) => ({
    name: challenge.name,
    description: challenge.description,
    hints: challenge.hints,
    points: challenge.points,
    solved: req.team.solves.includes(challenge.name),
    category: challenge.category,
  }));
  res.apiRes(challenges);
});

module.exports = router;
