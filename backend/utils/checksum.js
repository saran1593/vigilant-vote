const crypto = require('crypto');

const generateChecksum = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

const verifyChecksum = (content, checksum) => {
  return generateChecksum(content) === checksum;
};

module.exports = { generateChecksum, verifyChecksum };
