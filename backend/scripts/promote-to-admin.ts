#!/usr/bin/env ts-node
import 'tsconfig-paths/register';
import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../src/config/database';
import { User } from '../src/models/User';
import { logger } from '../src/utils/logger';

const email = process.argv[2] || process.env.PROMOTE_EMAIL;

if (!email) {
  console.error('Usage: ts-node promote-to-admin.ts <email>');
  process.exit(1);
}

const promote = async () => {
  try {
    await connectDatabase();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error('User not found:', email);
      process.exit(1);
    }

    user.role = 'admin';
    user.status = 'active';
    user.emailVerified = true;
    await user.save();

    console.log(`User ${email} promoted to admin.`);
    process.exit(0);
  } catch (err) {
    logger.error('Failed to promote user', err as Error);
    console.error(err);
    process.exit(1);
  }
};

promote();
