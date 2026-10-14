const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authorize } = require('../middleware/authMiddleware');

describe('Authentication & Role Authorization Tests', () => {
  const JWT_SECRET = 'test_jwt_secret_lms';

  test('hashes password using bcrypt and verifies correctly', async () => {
    const plainPassword = 'SecretPassword@123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);

    assert.notEqual(hash, plainPassword);
    assert.equal(typeof hash, 'string');

    // Verify valid password returns true
    const isValid = await bcrypt.compare(plainPassword, hash);
    assert.equal(isValid, true);

    // Verify incorrect password returns false
    const isInvalid = await bcrypt.compare('WrongPassword@999', hash);
    assert.equal(isInvalid, false);
  });

  test('signs and verifies JWT token with user id and role', () => {
    const payload = { id: 'user123', role: 'librarian' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const decoded = jwt.verify(token, JWT_SECRET);
    assert.equal(decoded.id, 'user123');
    assert.equal(decoded.role, 'librarian');
  });

  test('authorize middleware permits users with matching roles', (t, done) => {
    const middleware = authorize('admin', 'librarian');

    const req = { user: { role: 'librarian' } };
    const res = {};
    const next = () => {
      // next() called successfully -> test passes
      assert.ok(true);
      done();
    };

    middleware(req, res, next);
  });

  test('authorize middleware denies access with 403 when role is not permitted', (t, done) => {
    const middleware = authorize('admin', 'librarian');

    const req = { user: { role: 'student' } };
    const res = {
      status(code) {
        assert.equal(code, 403);
        return {
          json(data) {
            assert.equal(data.success, false);
            assert.match(data.message, /Forbidden/);
            done();
          }
        };
      }
    };
    const next = () => {
      assert.fail('next() should not be called for unauthorized role');
    };

    middleware(req, res, next);
  });

  test('authorize middleware rejects unauthenticated requests with 403', (t, done) => {
    const middleware = authorize('admin');

    const req = {}; // No user object attached
    const res = {
      status(code) {
        assert.equal(code, 403);
        return {
          json(data) {
            assert.equal(data.success, false);
            done();
          }
        };
      }
    };
    const next = () => {
      assert.fail('next() should not be called without req.user');
    };

    middleware(req, res, next);
  });
});
