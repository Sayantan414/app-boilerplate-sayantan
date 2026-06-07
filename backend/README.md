
# Boilerplate REST API

> 'Boilerplate' is a REST API using the Express framework in JavaScript for managing day-to-day operations and logging failures.

## Index

- [Clone](#clone)
- [Dependencies](#dependencies)
- [Run](#run)
- [URL](#URL)

## Clone

```bash
git clone git@bitbucket.org:programmersgroup/boilerplateapi.git
```

## Dependencies

```js
npm install bcryptjs  cors mongodb nodemailer googleapis onesignal-node superagent winston aws-sdk moment connect-multiparty jsonwebtoken lodash --save
npm install
```

## Run

### Development

```js
pm2 start --watch --env development
pm2 logs
pm2 stop BOILERPLATE_API_DEV
```

### Production

```js
pm2 start --watch --env production
pm2 logs
pm2 stop BOILERPLATE_API
```

## URL

```js
http://localhost:4065/api/
```
