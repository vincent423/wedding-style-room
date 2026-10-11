(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RentalStore = api;
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  // This demo state lives in one browser; it does not lock shared inventory or take payment.
  var sizes = ['XS', 'S', 'M', 'L'];
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var idCounter = 0;

  function cleanText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function emptyState() {
    return { version: 1, saved: [], bookings: [] };
  }

  function sanitize(value) {
    var state = emptyState();
    if (!value || Array.isArray(value) || value.version !== 1) return state;
    var savedIds = new Set();
    if (Array.isArray(value.saved)) {
      value.saved.forEach(function (id) {
        id = cleanText(id);
        if (id && !savedIds.has(id)) {
          savedIds.add(id);
          state.saved.push(id);
        }
      });
    }
    var bookingIds = new Set();
    var bookedDressIds = new Set();
    if (Array.isArray(value.bookings)) {
      value.bookings.forEach(function (item) {
        if (!item || typeof item !== 'object') return;
        var booking = {
          id: cleanText(item.id), dressId: cleanText(item.dressId),
          size: cleanText(item.size), name: cleanText(item.name),
          email: cleanText(item.email), createdAt: cleanText(item.createdAt), price: item.price
        };
        if (!booking.id || !booking.dressId || !booking.name ||
            sizes.indexOf(booking.size) < 0 || !emailPattern.test(booking.email) ||
            !Number.isFinite(Date.parse(booking.createdAt)) ||
            typeof booking.price !== 'number' || !Number.isFinite(booking.price) || booking.price < 0 ||
            bookingIds.has(booking.id) || bookedDressIds.has(booking.dressId)) return;
        bookingIds.add(booking.id);
        bookedDressIds.add(booking.dressId);
        state.bookings.push(booking);
      });
    }
    return state;
  }

  function readState(raw) {
    if (typeof raw !== 'string') return emptyState();
    try {
      return sanitize(JSON.parse(raw));
    } catch (error) {
      return emptyState();
    }
  }

  function toggleSaved(state, dressId) {
    var next = sanitize(state);
    var id = cleanText(dressId);
    if (!id) return next;
    var index = next.saved.indexOf(id);
    if (index >= 0) next.saved.splice(index, 1);
    else next.saved.push(id);
    return next;
  }

  function isReserved(state, dressId) {
    return !!(state && Array.isArray(state.bookings) && state.bookings.some(function (booking) {
      return booking && booking.dressId === dressId;
    }));
  }

  function validateBooking(input, dress, state) {
    input = input || {};
    var errors = {};
    if (!dress || !cleanText(dress.id) || input.dressId !== dress.id) {
      errors.dressId = 'Please choose a valid look.';
    }
    if (!dress || !Array.isArray(dress.sizes) || dress.sizes.indexOf(input.size) < 0) {
      errors.size = 'Please choose an available size.';
    }
    if (!cleanText(input.name)) errors.name = 'Please enter your name.';
    if (!emailPattern.test(cleanText(input.email))) errors.email = 'Please enter a valid email address.';
    if (!dress || dress.status !== 'available' || isReserved(state, dress.id)) {
      errors.availability = 'This look has already been reserved. Please choose another look.';
    }
    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  function nextBookingId(state) {
    var id;
    do {
      idCounter += 1;
      id = 'booking-' + Date.now().toString(36) + '-' + idCounter.toString(36) +
        '-' + Math.random().toString(36).slice(2, 10);
    } while (state.bookings.some(function (booking) { return booking.id === id; }));
    return id;
  }

  function reserveLook(state, input, dress) {
    var validation = validateBooking(input, dress, state);
    if (!validation.valid) {
      var error = new Error(Object.values(validation.errors).join(' '));
      error.errors = validation.errors;
      throw error;
    }
    var next = sanitize(state);
    var booking = {
      id: nextBookingId(next), dressId: dress.id, size: input.size,
      name: cleanText(input.name), email: cleanText(input.email),
      createdAt: new Date().toISOString(), price: dress.price
    };
    next.bookings.push(booking);
    return { state: next, booking: booking };
  }

  function cancelBooking(state, bookingId) {
    var next = sanitize(state);
    next.bookings = next.bookings.filter(function (booking) { return booking.id !== bookingId; });
    return next;
  }

  return {
    emptyState: emptyState, readState: readState, toggleSaved: toggleSaved,
    isReserved: isReserved, validateBooking: validateBooking,
    reserveLook: reserveLook, cancelBooking: cancelBooking
  };
}));
