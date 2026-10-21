/*
 * Load environment variables FIRST.
 *
 * This must come before importing Prisma,
 * because src/config/prisma.ts reads
 * process.env.DATABASE_URL when it loads.
 */
import 'dotenv/config'

import argon2 from 'argon2'

import prisma from './src/config/prisma'


/* ========================================
   RESET INPUTS
======================================== */

const email =
  process.env.RESET_EMAIL
    ?.trim()
    .toLowerCase()


const newPassword =
  process.env.NEW_PASSWORD


/* ========================================
   VALIDATION
======================================== */

if (!email) {

  console.error(
    'RESET_EMAIL environment variable is required',
  )

  process.exit(
    1,
  )
}


if (!newPassword) {

  console.error(
    'NEW_PASSWORD environment variable is required',
  )

  process.exit(
    1,
  )
}


if (
  newPassword.length <
  12
) {

  console.error(
    'Password must be at least 12 characters long',
  )

  process.exit(
    1,
  )
}


/* ========================================
   RESET PASSWORD
======================================== */

async function resetPassword() {

  /*
   * Find the user first.
   */
  const user =
    await prisma.user.findUnique({
      where: {
        email,
      },
    })


  if (!user) {

    console.error(
      `No user found with email: ${email}`,
    )

    process.exit(
      1,
    )
  }


  /*
   * Hash the new password using Argon2.
   *
   * MaliOS never stores the plain-text
   * password in the database.
   */
  const passwordHash =
    await argon2.hash(
      newPassword,
    )


  /*
   * Update the password and invalidate
   * all existing sessions in one
   * database transaction.
   */
  await prisma.$transaction([

    prisma.user.update({
      where: {
        id:
          user.id,
      },

      data: {
        passwordHash,
      },
    }),


    prisma.session.deleteMany({
      where: {
        userId:
          user.id,
      },
    }),
  ])


  console.log(
    `Password reset successfully for ${email}.`,
  )

  console.log(
    'All existing sessions were cleared.',
  )
}


/* ========================================
   RUN SCRIPT
======================================== */

resetPassword()
  .catch(
    (
      error,
    ) => {

      console.error(
        'Password reset failed:',
        error,
      )

      process.exitCode =
        1
    },
  )
  .finally(
    async () => {

      await prisma.$disconnect()
    },
  )