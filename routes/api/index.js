var express = require('express');
var router = express.Router();
const { getInventoryList } = require("../../models/index");

const { progressProcessor } = require("../../util/progressEmitter");
const myEmitter = new progressProcessor();

let status = '';
let errorEmitter = [];
let progressPercent = '';

myEmitter.on('progress', (a) => {
  setImmediate(() => {
    const { errors, status: statusFromEmit, progress } = a;
    if(errors) {
      errorEmitter.unshift(errors);
      errorEmitter.slice(0, 250);
    }
    status = statusFromEmit;
    if(progress) {
      progressPercent = progress;
    }
  });
});

router.post('/getInventoryList', async function(req, res, next) {
  const { body } = req;
  const { vehicle } = body;
  errorEmitter = [];
  progressPercent = '';
  const data = await getInventoryList({ vehicle, myEmitter }).then(d => d);
  if(data.error) {
    res.json({data: 'error'});
  } else {
    res.json({data});
  }
});

router.all('/getProgress', async function(req, res, next) {
  res.json({
    status,
    errorEmitter,
    progressPercent
  });
});


module.exports = router;
