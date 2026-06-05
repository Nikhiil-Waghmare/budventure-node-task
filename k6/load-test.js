import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  scenarios: {
    reservation_rush: {
      executor: 'per-vu-iterations',
      vus: 100, // 100 users
      iterations: 1,
      maxDuration: '30s',
    },
  },
};

export default function () {
  const userId = __VU + 1; // VU IDs start from 1, users start from 2

  const payload = JSON.stringify({
    userId: userId,
    itemId: 101, // Premium Apples
    quantity: 1, // Everyone trying to buy 1
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': uuidv4(),
    },
  };

  const res = http.post('http://localhost:3000/reserve-item', payload, params);

  const isOkOrBadRequest = check(res, {
    'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
  });

  if (isOkOrBadRequest && res.body) {
    try {
      const json = JSON.parse(res.body);
      if (res.status === 200) {
        check(json, {
          'success is true': (j) => j.success === true,
          'reservationId is an integer': (j) => typeof j.reservationId === 'number',
          'totalCost is correct': (j) => j.totalCost === 10.00,
          'has remainingStock': (j) => typeof j.remainingStock === 'number',
        });
      } else {
        check(json, {
          'error string present': (j) => typeof j.error === 'string',
        });
      }
    } catch (e) {
      check(res, {
        'response body is valid JSON': () => false,
      });
    }
  }

  sleep(Math.random() * 0.5); // Add jitter to simulate real traffic
}
