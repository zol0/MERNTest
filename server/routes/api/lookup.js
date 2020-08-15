const config = require('../../../config/config');
const { exec } = require("child_process");
const { query, validationResult } = require('express-validator');
const { isHash } = require('validator');

module.exports = (app) => {
  const cmds = {
    showCnt: config.showCnt,
    getValues: config.getValues
  }
  
  app.get('/api/lookup', [
      query('sha1').custom((value) => {
        value.split(';').forEach(sha1 => {
          if (!isHash(sha1, 'sha1')){
            throw new Error("Sha1 must be a valid sha1 string or semicolon separated sha1 string");
          }
        });
        return true;
      }).escape(),
      query('type').isAlphanumeric().escape(),
      query('command').isIn(cmds).escape()
    ],
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
      exec(config.remoteCmd + ' << EOF\n' +
        `  echo "${req.query.sha1}" | ${cmds[req.query.command]} ${req.query.type}\n` +
        'EOF',
        (err, stdout, stderr) => {
          res.status(200).send({stdout: stdout, stderr: stderr});
        }
      );
    }
  );
}
