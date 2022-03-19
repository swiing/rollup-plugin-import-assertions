import mimeDb from './mime-db.json' assert { type: 'json' };

t.deepEqual(mimeDb['application/1d-interleaved-parityfec'], {
  source: 'iana'
});
