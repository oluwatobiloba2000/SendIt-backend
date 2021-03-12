/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */
import migrate from './migration';

import db from '../db/index';

(async () => {
  try {
    // eslint-disable-next-line max-len
    const result = await migrate(db);
    result && console.log('database migrated successfully');
    process.exit();
  } catch (error) {
    console.log(error);
  }
})();
