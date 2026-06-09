require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4065,
  env: process.env.NODE_ENV || 'development',
  db: {
    url: process.env.MONGO_URI,
    name: process.env.DB_NAME,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
  },
  email: {
    user: process.env.EMAIL_USER,
    clientId: process.env.EMAIL_CLIENT_ID,
    clientSecret: process.env.EMAIL_CLIENT_SECRET,
    refreshToken: process.env.EMAIL_REFRESH_TOKEN,
  },
  sms: {
    mvayoo: {
      user: process.env.SMS_MVAYOO_USER,
      pass: process.env.SMS_MVAYOO_PASS,
      sender: process.env.SMS_MVAYOO_SENDER,
    },
    bizztel: {
      user: process.env.SMS_BIZZTEL_USER,
      pass: process.env.SMS_BIZZTEL_PASS,
      sender: process.env.SMS_BIZZTEL_SENDER,
    }
  },
  s3: {
    bucketName: process.env.S3_BUCKET_NAME,
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
};