# Security Vulnerability Remediation Plan (Revised v3)

**Date:** 2026-05-19
**Branch:** feature/security-audit
**Scope:** Fix 6 confirmed HIGH-severity vulnerabilities identified in the security audit
**Approach:** Privilege-based access control sourced from `defaultroles.json` (template) + `role` collection (customs)

---

## Context

The original audit-fix plan used role-based access control (`requireRole('APPADMIN', 'ADMIN')`). Through clarification it has been refined to fit how this project actually works:

1. **No public signup exists** — `/api/user/create` is always called by an authenticated admin. Roles must always be assigned (default by `ocode` presence) but **custom roles must be supported**.
2. **Privilege-based, not role-based, access control** — every route is gated by a privilege string (e.g., `Add User`, `Delete Organization`). Hard-coded role-name allowlists do not work because custom roles created at runtime would be locked out of every protected endpoint.
3. **Org soft-delete vs. cascade-remove flow** — the `Delete Organization` privilege gate belongs on `/delete`. The `/remove` endpoint operates only on already-soft-deleted records; no name-confirmation guard required.
4. **Password endpoints** — keep the existing `/updatePassword` (admin sets a known password) and add a new `/resetPassword` modeled on the legacy `sntmsapi` pattern (generates a 6-digit OTP, stores it hashed with `onetime: true`, emails/SMSes it). `/resetPassword` is **self-service only**.
5. **Default roles live in a backend JSON file, not in the DB** — `defaultroles.json` (moved from frontend to backend) holds the role templates (no `ocode` in the file). A new `/api/role/searchDefault` endpoint exposes them. The `role` collection only stores **custom** roles per organization. Privilege lookup at signin checks the DB first (for overrides/customs) and falls back to the JSON.

The intended outcome: every protected route is gated by a privilege string, custom roles work without code changes, default roles remain a single source of truth in the backend, and the password and org-removal flows match the project's intended workflow.

---

## Key Design Decisions

| Decision | Choice |
|---|---|
| Where do default roles live? | Backend file `src/config/defaultroles.json` — moved from frontend. Frontend reads them via `/api/role/searchDefault`. |
| Custom roles | Stored in `role` collection per `ocode` — unchanged from current schema. |
| How middleware reads privileges | Embedded in the JWT at signin (no per-request DB lookup). Trade-off: privilege changes propagate within 15 min (access-token TTL). |
| Where signin gets privileges from | First check `role` collection by `{ocode, name}`; if not found, fall back to `defaultroles.json` lookup by `name`. |
| `/resetPassword` scope | Self-service only — caller can only reset their own password (`req.user.id === _id`). |
| `/updatePassword` scope | Admin-only via `Reset Password` privilege; tenant-isolated. |
| `/delete` org gate | `Delete Organization` privilege. |
| `/remove` org gate | No privilege check — only allowed if target's `status === 'Removed'` + tenant isolation. |

---

## Priority Order

| Order | Vuln | Severity | Effort | Auth Required to Exploit |
|---|---|---|---|---|
| 1 | VULN-01: Path traversal in `/api/appmeta/:file` | HIGH | 5 min | None |
| 2 | VULN-05: NoSQL operator injection | HIGH | 30 min | Any JWT |
| 3 | Privilege-based RBAC foundation + `/searchDefault` | — | 1.5 hours | — |
| 4 | VULN-02: `/api/user/create` (auth + privilege + role validation) | HIGH | 30 min | None |
| 5 | VULN-06: Organization delete/remove privilege flow | HIGH | 30 min | Any JWT |
| 6 | VULN-04: Add `/resetPassword`, gate `/updatePassword` | HIGH | 45 min | Any JWT |
| 7 | VULN-03: Apply `requirePrivilege` middleware across all routes | HIGH | 2–3 hours | Any JWT |

---

## Privilege Model

### Data flow

```
defaultroles.json (in backend repo)  ──┐
                                       ├──► attachPrivileges(user) ──► JWT.privilege
role collection (custom roles)       ──┘                                    │
                                                                            ▼
                                                                requirePrivilege middleware
                                                                            │
                                                                            ▼
                                                                         allow / 403
```

1. At signin, controller looks up the user's role:
   - **First** queries `role` collection by `{ocode: user.ocode, name: user.role}` (custom or override)
   - **Then** falls back to `defaultroles.json` matching by `name`
   - APPADMIN / APPUSER (no `ocode`) always look up from JSON
2. Access-token JWT payload is extended to carry `privilege: [string]`.
3. New `requirePrivilege(name)` middleware checks `req.user.privilege.includes(name)` and 403s otherwise.
4. APPADMIN gets a `'*'` sentinel that bypasses every privilege check (superuser).

### Privilege naming convention

Use the same names already present in `defaultroles.json` — `Add <Noun>`, `Edit <Noun>`, `Delete <Noun>`, `View <Noun>`, plus special names like `Reset Password`. Keeping the names in sync with the JSON means no UI/backend mismatch.

### Permission Matrix (aligned with `defaultroles.json` names)

| Route | Required Privilege |
|---|---|
| `POST /api/user/signin` | _public_ |
| `POST /api/user/signout` | _any authenticated_ |
| `POST /api/user/refresh-token` | _cookie-only_ |
| `GET  /api/user/me` | _any authenticated_ |
| `POST /api/user/create` | `Add User` |
| `POST /api/user/update` | `Edit User` |
| `POST /api/user/delete` | `Delete User` |
| `POST /api/user/search` | `View User` |
| `POST /api/user/count` | `View User` |
| `GET  /api/user/show/:id` | `View User` |
| `POST /api/user/updatePassword` | `Reset Password` |
| `POST /api/user/resetPassword` | _self only_ (`req.user.id === _id`) |
| `POST /api/organization/create` | `Add Organization` |
| `POST /api/organization/update` | `Edit Organization` |
| `POST /api/organization/delete` | `Delete Organization` |
| `POST /api/organization/remove` | _status==='Removed'_ + tenant check (no privilege) |
| `POST /api/organization/upload` | `Edit Organization` |
| `GET/POST /api/organization/show,showByCode,showAll,search,count` | `View Organization` |
| `POST /api/organization/countries,states,cities,zones` | `View Organization` |
| `GET  /api/organization/orgLogo/:file` | _public_ |
| `POST /api/role/create` | `Add Role` |
| `POST /api/role/update` | `Edit Role` |
| `POST /api/role/delete` | `Delete Role` |
| `POST /api/role/search,show,count,showByName` | `View Role` |
| `POST /api/role/searchDefault` | `View Role` |
| `POST /api/smslog/search,count,totalUsage` | `View SMS Log` (add to defaultroles.json) |
| `POST /api/userlog/search,count` | `View User Log` |
| `GET  /api/appmeta/:file` | _public_ |

> **Note:** `View SMS Log` is **not yet present** in `defaultroles.json`. Add it to the APPADMIN, APPUSER, ADMIN role entries during this change.

---

## Files Modified / Created

| File | Change |
|---|---|
| `src/config/defaultroles.json` (new) | Move from frontend; backend canonical copy. Add `View SMS Log`. |
| `src/utils/token.utils.js` | Include `privilege` in JWT payload; pin `algorithms: ['HS256']` on verify |
| `src/controllers/user.controller.js` | `attachPrivileges` helper (DB → JSON fallback); new `resetPassword`; `updatePassword` adds tenant isolation; signin/refresh attach privileges |
| `src/controllers/role.controller.js` | Add `searchDefault` controller |
| `src/middlewares/rbac.middleware.js` (new) | `requirePrivilege(name)`, `requireSameOrg(...)` |
| `src/controllers/index.controller.js` | Fix path traversal in `getAppMeta` |
| `src/utils/request.utils.js` | Recursively strip `$`-prefixed and dot-notation keys in `cleanAndConvert` |
| `src/controllers/organization.controller.js` | `/remove` checks `status === 'Removed'` + tenant isolation; remove name-confirmation logic |
| `src/routes/*.routes.js` (all) | Add `auth` + `requirePrivilege(...)` per matrix; add `searchDefault` route |
| `src/validations/user.validation.js` | Role becomes optional in `register`; validated against JSON+DB in controller |

---

## Step-by-Step Implementation

### Step 0 — Branch & move `defaultroles.json`

```bash
git checkout -b fix/security-audit
# Copy defaultroles.json from frontend repo to src/config/defaultroles.json
# Add "View SMS Log" to APPADMIN, APPUSER, ADMIN role entries
```

---

### Step 1 — Path Traversal in `getAppMeta` (VULN-01)

**File:** `src/controllers/index.controller.js` (lines 34–47)

```js
const getAppMeta = (req, res) => {
  const file = path.basename(req.params.file);                  // strip ../
  let filePath = path.resolve(UPLOAD_PATH, file);
  if (!filePath.startsWith(path.resolve(UPLOAD_PATH))) {        // boundary check
    return errorResponse(res, 'Forbidden', 403);
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.resolve(UPLOAD_PATH, 'app-metadata.json');
  }
  if (!fs.existsSync(filePath)) {
    return errorResponse(res, 'App metadata file not found', 404);
  }
  fs.createReadStream(filePath).pipe(res);
};
```

#### Verify

```bash
curl -i http://localhost:4065/api/appmeta/../../config/config.js   # expect 403
curl -i http://localhost:4065/api/appmeta/app-metadata.json        # expect 200
```

---

### Step 2 — NoSQL Operator Injection (VULN-05)

**File:** `src/utils/request.utils.js`

```js
const sanitizeOperators = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeOperators);
  if (value !== null && typeof value === 'object') {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      cleaned[key] = sanitizeOperators(value[key]);
    }
    return cleaned;
  }
  return value;
};

const cleanAndConvert = (obj, options = {}) => {
  let newObj = sanitizeOperators({ ...obj });
  // ...rest of existing function unchanged
};
```

Also in `user.controller.js` near line 249, guard signin:

```js
const { userid, password } = req.body;
if (typeof userid !== 'string' || typeof password !== 'string') {
  return errorResponse(res, 'Invalid credentials', 400);
}
```

#### Verify

```bash
curl -i -X POST http://localhost:4065/api/user/signin \
  -H 'Content-Type: application/json' \
  -d '{"userid":{"$ne":null},"password":{"$ne":null}}'   # expect 400
```

---

### Step 3 — Privilege-Based RBAC Foundation

#### 3a — JWT payload extension

**File:** `src/utils/token.utils.js`

```js
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      userid: user.userid,
      email: user.email,
      role: user.role,
      ocode: user.ocode,
      privilege: user.privilege || [],     // NEW
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiration, algorithm: 'HS256' }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret, { algorithms: ['HS256'] });
};
```

#### 3b — `attachPrivileges` helper (DB-first, JSON fallback)

**File:** `src/controllers/user.controller.js`

```js
const defaultRoles = require('../config/defaultroles.json');

const attachPrivileges = async (user) => {
  // APPADMIN: superuser bypass
  if (!user.ocode && user.role === 'APPADMIN') {
    user.privilege = ['*'];
    return user;
  }

  // Global roles without ocode (e.g., APPUSER)
  if (!user.ocode) {
    const globalRole = defaultRoles.find(r => r.name === user.role);
    user.privilege = globalRole ? globalRole.privilege : [];
    return user;
  }

  // Org user: check custom/override role in DB first
  const customRole = await commondb.findOne('role',
    { ocode: user.ocode, name: user.role });
  if (customRole && Array.isArray(customRole.privilege)) {
    user.privilege = customRole.privilege;
    return user;
  }

  // Fall back to default role template (excluding global-only roles)
  const defaultRole = defaultRoles.find(r =>
    r.name === user.role && r.name !== 'APPADMIN' && r.name !== 'APPUSER'
  );
  user.privilege = defaultRole ? defaultRole.privilege : [];
  return user;
};
```

Call `await attachPrivileges(user)` in `signin` before `generateAccessToken(user)`, and in `refreshToken` after the user lookup.

#### 3c — `requirePrivilege` middleware

**New file:** `src/middlewares/rbac.middleware.js`

```js
const { errorResponse } = require('../utils/response.utils');

const requirePrivilege = (name) => (req, res, next) => {
  if (!req.user || !Array.isArray(req.user.privilege)) {
    return errorResponse(res, 'Authentication required', 401);
  }
  if (req.user.privilege.includes('*')) return next();    // APPADMIN bypass
  if (!req.user.privilege.includes(name)) {
    return errorResponse(res, `Forbidden: missing privilege "${name}"`, 403);
  }
  next();
};

const requireSameOrg = (getTargetOcode) => async (req, res, next) => {
  try {
    if (req.user.privilege?.includes('*')) return next();
    const target = await getTargetOcode(req);
    if (!target) return errorResponse(res, 'Target not found', 404);
    if (req.user.ocode !== target) {
      return errorResponse(res, 'Forbidden: cross-organization access denied', 403);
    }
    next();
  } catch (err) {
    return errorResponse(res, 'Authorization check failed', 500);
  }
};

module.exports = { requirePrivilege, requireSameOrg };
```

---

### Step 4 — `/api/role/searchDefault` endpoint (NEW)

**File:** `src/controllers/role.controller.js` — add controller

```js
const defaultRoles = require('../config/defaultroles.json');

const searchDefault = async (req, res) => {
  try {
    const { ocode } = req.body;
    let roles = defaultRoles;
    if (ocode) {
      // Hide global-only roles when scoped to an organization
      roles = roles.filter(r => r.name !== 'APPADMIN' && r.name !== 'APPUSER');
    }
    return successResponse(res, 'Default roles fetched', roles, 200);
  } catch (err) {
    console.error('Default Role Search Error:', err);
    return errorResponse(res, 'API error! Please try again.', 500);
  }
};

module.exports = {
  // ...existing exports
  searchDefault,
};
```

**File:** `src/routes/role.routes.js`

```js
router.post('/searchDefault', auth, requirePrivilege('View Role'),
            roleController.searchDefault);
```

---

### Step 5 — `/api/user/create` (VULN-02)

**Files:** `src/routes/user.routes.js`, `src/validations/user.validation.js`, `src/controllers/user.controller.js`

#### Route
```js
const { requirePrivilege } = require('../middlewares/rbac.middleware');
router.post('/create', auth, requirePrivilege('Add User'),
  validate(userValidation.create), userController.create);
```

#### Validation — role optional, free-form string
```js
const create = {
  body: Joi.object().keys({
    mobile:    Joi.string().required(),
    userid:    Joi.string().optional(),
    email:     Joi.string().email().allow('', null),
    firstname: Joi.string().required(),
    lastname:  Joi.string().allow('', null),
    password:  Joi.string().required().min(6),
    role:      Joi.string().optional(),
    status:    Joi.string().valid('Active', 'Inactive').default('Active'),
    ocode:     Joi.string().allow('', null),
    notificationid: Joi.array().items(Joi.string()).default([]),
    empno:     Joi.string().allow('', null),
    dept_name: Joi.string().allow('', null),
  }),
};
```

#### Controller — defaults + validate role exists (DB or JSON) + tenant isolation

In `create()`, before the password-hash step:

```js
const defaultRoles = require('../config/defaultroles.json');

// Default role assignment
if (!obj.role) {
  obj.role = obj.ocode ? 'USER' : 'APPADMIN';
}

// Validate the role exists — either as custom (in DB) or default (in JSON)
if (obj.ocode) {
  const custom = await commondb.findOne('role',
    { ocode: obj.ocode, name: obj.role });
  const isDefault = defaultRoles.some(r =>
    r.name === obj.role && r.name !== 'APPADMIN' && r.name !== 'APPUSER'
  );
  if (!custom && !isDefault) {
    return errorResponse(res,
      `Role "${obj.role}" does not exist for this organization`, 400);
  }
} else {
  const isGlobal = defaultRoles.some(r =>
    r.name === obj.role && (r.name === 'APPADMIN' || r.name === 'APPUSER')
  );
  if (!isGlobal) {
    return errorResponse(res,
      `Role "${obj.role}" is not a valid app-level role`, 400);
  }
}

// Tenant isolation: non-APPADMIN can only create users in their own org
if (req.user.ocode && req.user.ocode !== obj.ocode) {
  return errorResponse(res,
    'Forbidden: cannot create users in other organizations', 403);
}
```

> **Bootstrap:** the first APPADMIN must be seeded manually via mongo shell. After that, sign-in works because `attachPrivileges` reads APPADMIN privileges from the JSON file (no role document needed).

---

### Step 6 — Organization Delete / Remove (VULN-06)

**Files:** `src/routes/organization.routes.js`, `src/controllers/organization.controller.js`

#### Routes

```js
router.post('/delete', auth, requirePrivilege('Delete Organization'),
            organizationController.deleteOrg);
router.post('/remove', auth, organizationController.remove);
```

#### `remove` controller — replace lines 243–286

```js
const remove = async (req, res) => {
  try {
    const { _id } = req.body;
    const ipaddress = getIpAddress(req);

    if (!_id) return errorResponse(res, 'Invalid record ID', 400);

    const old = await commondb.findOne(model, { _id });
    if (!old) return errorResponse(res, 'Record not found', 404);

    // Guard 1: must already be soft-deleted via /delete
    if (old.status !== 'Removed') {
      return errorResponse(res,
        'Organization must be soft-deleted via /delete before permanent removal', 400);
    }

    // Guard 2: tenant isolation (APPADMIN bypass)
    if (!req.user.privilege?.includes('*') && req.user.ocode !== old.ocode) {
      return errorResponse(res,
        'Forbidden: cannot remove other organizations', 403);
    }

    const collInfos = await commondb.getCollections();
    for (let i = 0; i < collInfos.length; i++) {
      await commondb.deleteMany(collInfos[i].name, { ocode: old.ocode });
    }

    await logModel.insertLog({
      collection: model,
      userid: req.user.userid,
      type: 'Delete',
      reference: old.ocode,
      message: 'organization has been permanently removed',
      ipaddress,
    });

    if (old.logo) {
      await storageService.deleteFile(IMAGE_FOLDER, old.logo).catch(e => {
        console.error('Failed to delete logo from storage:', e);
      });
    }

    return successResponse(res, 'Organization permanently deleted',
      { message: `${old.oname} permanently deleted` }, 200);
  } catch (err) {
    console.error('Organization Permanent Delete Error:', err);
    return errorResponse(res, err.message || 'Internal Server Error', 500);
  }
};
```

---

### Step 7 — Password Endpoints (VULN-04)

#### Existing `/updatePassword` — privilege + tenant isolation

**File:** `src/controllers/user.controller.js:334–358`

```js
const updatePassword = async (req, res) => {
  try {
    const { _id, password } = req.body;
    const ipaddress = getIpAddress(req);

    if (!_id || !password) return errorResponse(res, 'Invalid input', 400);

    const target = await commondb.findOne(modelName, { _id });
    if (!target) return errorResponse(res, 'User not found', 404);

    // Tenant isolation (APPADMIN bypass)
    if (!req.user.privilege?.includes('*') && req.user.ocode !== target.ocode) {
      return errorResponse(res,
        'Forbidden: cross-organization access denied', 403);
    }

    const hashedPassword = await passwordUtils.hashPassword(password);
    await commondb.updateOne(modelName, { _id }, {
      $set: { password: hashedPassword, onetime: false, lastupdatedon: new Date() },
    });

    await logModel.insertLog({
      collection: modelName,
      ocode:      target.ocode,
      userid:     req.user.userid,
      type:       'Update',
      reference:  target.userid,
      message:    'password has been updated by admin',
      ipaddress,
    });

    return successResponse(res, 'Password updated successfully');
  } catch (error) {
    return errorResponse(res, 'Error updating password', 500);
  }
};
```

#### New `/resetPassword` — self-service OTP reset

```js
const resetPassword = async (req, res) => {
  try {
    const { _id } = req.body;
    const ipaddress = getIpAddress(req);

    if (!_id) return errorResponse(res, 'User ID is required', 400);

    // Self-service only
    if (String(req.user.id) !== String(_id)) {
      return errorResponse(res,
        'Forbidden: can only reset your own password', 403);
    }

    const target = await commondb.findOne(modelName, { _id });
    if (!target) return errorResponse(res, 'User not found', 404);

    const newPassword = passwordUtils.generateOTP();
    const hashed      = await passwordUtils.hashPassword(newPassword);

    await commondb.updateOne(modelName, { _id }, {
      $set: { password: hashed, onetime: true, lastupdatedon: new Date() },
      refreshTokens: [],
    });

    if (target.email) {
      emailService.sendEmail({
        to: target.email,
        subject: 'Your password has been reset',
        html: `<p>Hi ${target.firstname},</p>
               <p>Your password has been reset. Your temporary password is:</p>
               <h2>${newPassword}</h2>
               <p>You will be asked to change it on next sign-in.</p>`,
      }).catch(e => logger.error('Reset email failed', e));
    }
    if (target.mobile) {
      smsService.sendByMvayoo({
        mobile:  target.mobile,
        message: `Your temporary password: ${newPassword}. Please change it on next sign-in.`,
        ocode:   target.ocode,
        userid:  target.userid,
      }).catch(e => logger.error('Reset SMS failed', e));
    }

    await logModel.insertLog({
      collection: modelName,
      ocode:      target.ocode,
      userid:     req.user.userid,
      type:       'Update',
      reference:  target.userid,
      message:    'password has been reset (self-service)',
      ipaddress,
    });

    return successResponse(res,
      'Password reset; temporary password sent via email/SMS');
  } catch (error) {
    logger.error('Reset Password Error:', error);
    return errorResponse(res, 'Error resetting password', 500);
  }
};

module.exports = { /* existing */ resetPassword };
```

#### Routes

```js
router.post('/updatePassword', auth, requirePrivilege('Reset Password'),
            userController.updatePassword);
router.post('/resetPassword',  auth, userController.resetPassword);
```

---

### Step 8 — Apply Privilege Middleware to All Routes (VULN-03)

#### Example: `src/routes/user.routes.js`

```js
const { requirePrivilege } = require('../middlewares/rbac.middleware');

router.post('/signin',  validate(userValidation.signin), userController.signin);
router.post('/signout', auth, userController.signout);
router.post('/refresh-token', userController.refreshToken);
router.get('/me',       auth, userController.getMe);

router.post('/create', auth, requirePrivilege('Add User'),
            validate(userValidation.create), userController.create);
router.post('/update', auth, requirePrivilege('Edit User'),
            validate(userValidation.update), userController.update);
router.post('/delete', auth, requirePrivilege('Delete User'),
            userController.remove);

router.post('/search', auth, requirePrivilege('View User'), userController.search);
router.post('/count',  auth, requirePrivilege('View User'), userController.count);
router.get('/show/:id', auth, requirePrivilege('View User'), userController.show);

router.post('/updatePassword', auth, requirePrivilege('Reset Password'),
            userController.updatePassword);
router.post('/resetPassword',  auth, userController.resetPassword);
```

Repeat for `organization.routes.js`, `role.routes.js`, `smslog.routes.js`, `userlog.routes.js` per the permission matrix.

#### Tenant isolation inside controllers

In each `update`/`delete`/`show` for user/role/organization, after fetching the target:

```js
if (!req.user.privilege?.includes('*') && req.user.ocode !== target.ocode) {
  return errorResponse(res,
    'Forbidden: cross-organization access denied', 403);
}
```

---

## Verification

### Seed test data

- **APPADMIN user** (no `ocode`) — privileges come from `defaultroles.json` (sentinel `'*'`)
- **Org `acme`** with one ADMIN user (default role; privileges from JSON), one USER (default role; privileges from JSON)
- **Org `acme`** also has a custom `AUDITOR` role inserted into `role` collection with `privilege: ['View User', 'View SMS Log', 'View User Log']` — and one user assigned `AUDITOR`
- **Org `bravo`** with one ADMIN user

### Test matrix

```bash
# 1) Path traversal blocked
curl -i http://localhost:4065/api/appmeta/../../config/config.js          # 403

# 2) NoSQL operator injection blocked
curl -i -X POST http://localhost:4065/api/user/signin \
  -H 'Content-Type: application/json' \
  -d '{"userid":{"$ne":null},"password":{"$ne":null}}'                    # 400

# 3) Default role (USER) lacks "Add User"
TOKEN_USER=...
curl -i -X POST http://localhost:4065/api/user/create \
  -H "Authorization: Bearer $TOKEN_USER" -d '{...}'                       # 403

# 4) Custom role AUDITOR can view SMS log (proves custom roles in DB work)
TOKEN_AUDIT=...
curl -i -X POST http://localhost:4065/api/smslog/search \
  -H "Authorization: Bearer $TOKEN_AUDIT" -d '{}'                         # 200

# 5) Default role ADMIN can add users (proves JSON fallback works)
TOKEN_ADMIN_ACME=...
curl -i -X POST http://localhost:4065/api/user/create \
  -H "Authorization: Bearer $TOKEN_ADMIN_ACME" -d '{...,"ocode":"acme"}'  # 200

# 6) /searchDefault filters by ocode
curl -i -X POST http://localhost:4065/api/role/searchDefault \
  -H "Authorization: Bearer $TOKEN_ANY" -d '{}'                           # all incl. APPADMIN
curl -i -X POST http://localhost:4065/api/role/searchDefault \
  -H "Authorization: Bearer $TOKEN_ANY" -d '{"ocode":"acme"}'             # no APPADMIN/APPUSER

# 7) /resetPassword self-only
curl -i -X POST http://localhost:4065/api/user/resetPassword \
  -H "Authorization: Bearer $TOKEN_USER" \
  -d '{"_id":"<other_users_id>"}'                                         # 403
curl -i -X POST http://localhost:4065/api/user/resetPassword \
  -H "Authorization: Bearer $TOKEN_USER" \
  -d '{"_id":"<own_id>"}'                                                 # 200, OTP sent

# 8) Org /remove blocked when not soft-deleted
curl -i -X POST http://localhost:4065/api/organization/remove \
  -H "Authorization: Bearer $TOKEN_ADMIN_ACME" \
  -d '{"_id":"<acme_id>"}'                                                # 400

# 9) Proper two-step flow
curl -i -X POST http://localhost:4065/api/organization/delete \
  -H "Authorization: Bearer $TOKEN_ADMIN_ACME" \
  -d '{"_id":"<acme_id>"}'                                                # 200
curl -i -X POST http://localhost:4065/api/organization/remove \
  -H "Authorization: Bearer $TOKEN_ADMIN_ACME" \
  -d '{"_id":"<acme_id>"}'                                                # 200

# 10) Cross-tenant blocked
TOKEN_ADMIN_BRAVO=...
curl -i -X POST http://localhost:4065/api/user/updatePassword \
  -H "Authorization: Bearer $TOKEN_ADMIN_BRAVO" \
  -d '{"_id":"<acme_user_id>","password":"x"}'                            # 403

# 11) APPADMIN bypass works (privilege ['*'])
TOKEN_APPADMIN=...
curl -i -X POST http://localhost:4065/api/user/delete \
  -H "Authorization: Bearer $TOKEN_APPADMIN" \
  -d '{"_id":"<any_user_id>"}'                                            # 200
```

---

## Frontend Coordination Required

| Change | Frontend Impact |
|---|---|
| Privileges in JWT payload | Decode JWT (or call `/me`) to hide buttons for missing privileges |
| `/api/user/resetPassword` is new | Add "Reset my password" button on profile screen |
| `/api/user/updatePassword` now needs `Reset Password` privilege | Move from profile screen to admin user-management UI |
| `onetime: true` after reset | Signin must detect `user.onetime` and force the password-change screen |
| `/api/organization/remove` requires prior `/delete` | UI should first call `/delete`, then `/remove` |
| `defaultroles.json` is now in backend | Frontend deletes local copy; calls `/api/role/searchDefault` (with/without `ocode`) to populate role pickers |
| Role-management UI merges defaults + customs | Two API calls: `/role/searchDefault` (template) + `/role/search` (custom). Customs override defaults by name. |

---

## Out of Scope / Deferred

- **First-user bootstrap** — seed manually via mongo shell (no role document required; privileges read from JSON).
- **Rotate `.env` secrets** — DB password, JWT secrets, Gmail OAuth refresh, SMS gateway creds, DO Spaces keys (all committed to git history). Operational task, not code.
- **Stack-trace exposure in dev mode** — by design; ensure `NODE_ENV=production` on prod deploys.
- **X-Forwarded-For trust** — relevant only when audit logs become compliance artifacts.
- **Refresh tokens stored in plaintext** — defense-in-depth improvement; separate task.
- **Search/list endpoints currently return soft-deleted orgs** — controllers should optionally filter `status !== 'Removed'`. Out of audit scope.
- **Per-org customization of default-role privileges** — if needed later, admins insert a role document into the `role` collection with the same `name` as a default; `attachPrivileges` will use it as an override. No code change required.

---

## Rollback Plan

Each step is independent and can be reverted in isolation via `git revert`. The privilege middleware can be soft-disabled by stubbing `requirePrivilege` to `(req, res, next) => next()`, restoring prior behavior without touching every route — useful if a misconfigured role causes mass 403s in production.
