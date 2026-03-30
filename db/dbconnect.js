'use strict'
import { connect } from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGOURL) {
      throw new Error('MONGOURL environment variable is not defined for database connection');
    };
    const conn = await connect(process.env.MONGOURL, {});
    console.debug(`\x1b[32m✔ MongoDB Database:\x1b[0m \x1b[36m${conn.connection.name}\x1b[0m \x1b[32mConnected Successfully!\x1b[0m`);
  } catch (error) {
    console.error('Critical Error: MongoDB Connection Failed');
    console.error('Error Details:', error.message);
    process.exit(1);
  };
};
export default connectDB;