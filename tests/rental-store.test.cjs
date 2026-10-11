const test = require('node:test');
const assert = require('node:assert/strict');

let store;
try {
  store = require('../assets/js/rental-store.js');
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  store = {};
}

function api(name) {
  assert.equal(typeof store[name], 'function', `Missing rental behavior: ${name}`);
  return store[name];
}

const dress = {
  id: 'ivory-muse', name: 'Ivory Muse', sizes: ['XS', 'S', 'M', 'L'],
  price: 79, status: 'available'
};
const validInput = {
  dressId: 'ivory-muse', size: 'M', name: 'Jamie Lee', email: 'jamie@example.com'
};
const persistedBooking = {
  id: 'booking-one', dressId: 'ivory-muse', size: 'M', name: 'Jamie Lee',
  email: 'jamie@example.com', createdAt: '2026-10-11T12:00:00.000Z', price: 79
};

test('each fresh state is independent', () => {
  const first = api('emptyState')();
  const second = store.emptyState();
  assert.deepEqual(first, { version: 1, saved: [], bookings: [] });
  first.saved.push('ivory-muse');
  assert.deepEqual(second.saved, []);
});

test('malformed or unsupported stored data resets safely', () => {
  const read = api('readState');
  for (const raw of [null, '', '{broken', 'null', '[]', 'false', '42',
    '{"version":2,"saved":["ivory-muse"],"bookings":[]}']) {
    assert.deepEqual(read(raw), { version: 1, saved: [], bookings: [] });
  }
});

test('persistence sanitizes saved IDs and unsafe booking records', () => {
  const read = api('readState');
  const raw = JSON.stringify({
    version: 1,
    saved: ['ivory-muse', 'ivory-muse', '', '   ', 123, null, 'garden-party'],
    bookings: [
      persistedBooking,
      { ...persistedBooking, id: 'duplicate-dress' },
      { ...persistedBooking, dressId: 'duplicate-id' },
      { ...persistedBooking, id: 'missing-email', dressId: 'other', email: '' },
      { ...persistedBooking, id: 'bad-price', dressId: 'other', price: -1 },
      { ...persistedBooking, id: 'bad-date', dressId: 'other', createdAt: 'never' },
      null,
      { ...persistedBooking, id: 'booking-two', dressId: 'garden-party', extra: 'discard' }
    ],
    extra: 'discard'
  });
  assert.deepEqual(read(raw), {
    version: 1, saved: ['ivory-muse', 'garden-party'],
    bookings: [persistedBooking, { ...persistedBooking, id: 'booking-two', dressId: 'garden-party' }]
  });
});

test('toggling a saved look preserves bookings and input state', () => {
  const toggle = api('toggleSaved');
  const state = { version: 1, saved: ['garden-party'], bookings: [persistedBooking] };
  const before = JSON.stringify(state);
  const saved = toggle(state, 'ivory-muse');
  const removed = toggle(saved, 'ivory-muse');
  assert.deepEqual(saved.saved, ['garden-party', 'ivory-muse']);
  assert.deepEqual(removed.saved, ['garden-party']);
  assert.deepEqual(removed.bookings, [persistedBooking]);
  assert.equal(JSON.stringify(state), before);
  assert.notEqual(saved.saved, state.saved);
  assert.deepEqual(toggle(state, '').saved, ['garden-party']);
});

test('booking validation accepts a valid available look', () => {
  const validate = api('validateBooking');
  assert.deepEqual(validate(validInput, dress, { version: 1, saved: [], bookings: [] }),
    { valid: true, errors: {} });
});

test('booking validation reports invalid contact, size, and dress fields', () => {
  const validate = api('validateBooking');
  const state = { version: 1, saved: [], bookings: [] };
  const cases = [
    ['dressId', { dressId: 'different-look' }],
    ['size', { size: 'XXL' }],
    ['size', { size: '' }],
    ['name', { name: '   ' }],
    ['email', { email: '' }],
    ['email', { email: 'jamie.example.com' }],
    ['email', { email: 'jamie@' }],
    ['email', { email: 'jamie @example.com' }],
    ['email', { email: 'jamie@example' }]
  ];
  for (const [field, changes] of cases) {
    const result = validate({ ...validInput, ...changes }, dress, state);
    assert.equal(result.valid, false, field);
    assert.equal(typeof result.errors[field], 'string', field);
  }
  const missing = validate(null, null, state);
  assert.equal(missing.valid, false);
  assert.ok(missing.errors.name);
  assert.ok(missing.errors.email);
});

test('catalog availability and restored reservations prevent another booking', () => {
  const validate = api('validateBooking');
  const reservedState = { version: 1, saved: [], bookings: [persistedBooking] };
  assert.equal(api('isReserved')(reservedState, 'ivory-muse'), true);
  assert.equal(store.isReserved(reservedState, 'garden-party'), false);
  assert.ok(validate(validInput, dress, reservedState).errors.availability);
  assert.ok(validate(validInput, { ...dress, status: 'reserved' },
    { version: 1, saved: [], bookings: [] }).errors.availability);
});

test('reservation creates a normalized durable booking without mutating inputs', () => {
  const reserve = api('reserveLook');
  const state = { version: 1, saved: ['ivory-muse'], bookings: [] };
  const input = { ...validInput, name: ' Jamie Lee ', email: ' jamie@example.com ' };
  const before = JSON.stringify({ state, input, dress });
  const result = reserve(state, input, dress);
  assert.equal(result.state.bookings.length, 1);
  assert.equal(result.booking.dressId, 'ivory-muse');
  assert.equal(result.booking.size, 'M');
  assert.equal(result.booking.name, 'Jamie Lee');
  assert.equal(result.booking.email, 'jamie@example.com');
  assert.equal(result.booking.price, 79);
  assert.equal(typeof result.booking.id, 'string');
  assert.ok(result.booking.id.length > 0);
  assert.ok(Number.isFinite(Date.parse(result.booking.createdAt)));
  assert.deepEqual(result.state.saved, ['ivory-muse']);
  assert.equal(JSON.stringify({ state, input, dress }), before);
  const replayed = api('readState')(JSON.stringify(result.state));
  assert.deepEqual(replayed, result.state);
  assert.throws(() => reserve(replayed, validInput, dress), Error);
});

test('invalid reservations throw and leave the supplied state untouched', () => {
  const reserve = api('reserveLook');
  const state = { version: 1, saved: [], bookings: [] };
  assert.throws(() => reserve(state, { ...validInput, email: 'broken' }, dress), Error);
  assert.throws(() => reserve(state, validInput, { ...dress, status: 'reserved' }), Error);
  assert.deepEqual(state, { version: 1, saved: [], bookings: [] });
});

test('separate look reservations receive unique booking IDs', () => {
  const reserve = api('reserveLook');
  const first = reserve({ version: 1, saved: [], bookings: [] }, validInput, dress);
  const second = reserve(first.state,
    { ...validInput, dressId: 'garden-party' }, { ...dress, id: 'garden-party' });
  assert.notEqual(first.booking.id, second.booking.id);
  assert.equal(second.state.bookings.length, 2);
  assert.equal(first.state.bookings.length, 1);
});

test('cancellation releases only the selected booking and preserves saved looks', () => {
  const cancel = api('cancelBooking');
  const secondBooking = { ...persistedBooking, id: 'booking-two', dressId: 'garden-party' };
  const state = {
    version: 1, saved: ['ivory-muse', 'garden-party'],
    bookings: [persistedBooking, secondBooking]
  };
  const before = JSON.stringify(state);
  const cancelled = cancel(state, 'booking-one');
  assert.deepEqual(cancelled.bookings, [secondBooking]);
  assert.deepEqual(cancelled.saved, ['ivory-muse', 'garden-party']);
  assert.equal(api('isReserved')(cancelled, 'ivory-muse'), false);
  assert.equal(store.isReserved(cancelled, 'garden-party'), true);
  assert.equal(JSON.stringify(state), before);
  assert.deepEqual(cancel(state, 'nonexistent'), state);
});
