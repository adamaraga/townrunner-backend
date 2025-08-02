/**
 * Calculate the delivery price according to Lagos/Abuja bike fares.
 *
 * @param {number} distanceKm    Distance in kilometers.
 * @param {number} durationMin   Duration in minutes.
 * @param {number} stopsCount    Number of extra stops (0, 1, or 2).
 * @param {Date}   [date=new Date()]      The pickup datetime.
 * @param {boolean}[isBadWeather=false]   Whether to apply a weather surcharge.
 * @returns {number}  Rounded total price in Naira.
 */

function calculateDeliveryPrice({
  distanceKm,
  durationMin,
  stopsCount = 0,
  date = new Date(),
  isBadWeather = false,
}) {
  distanceKm = Number(distanceKm);
  durationMin = Number(durationMin);
  stopsCount = Number(stopsCount);

  const BASE_FARE = 500; // ₦500
  const RATE_PER_KM = 150; // ₦150/km
  const RATE_PER_MIN = 50; // ₦50/min
  const STOP_FEE = 200; // ₦200 per extra stop
  const MINIMUM_FARE = 800; // ₦800 minimum
  const SURGE_PEAK = 1.2; // +20% peak multiplier
  const SURGE_WEATHER = 1.2; // +20% weather/night multiplier

  const RIDER_PAY = 0.8; // 80% rider pay

  // 1) Base components
  let price =
    BASE_FARE +
    distanceKm * RATE_PER_KM +
    durationMin * RATE_PER_MIN +
    stopsCount * STOP_FEE;

  // 2) Enforce minimum
  price = Math.max(price, MINIMUM_FARE);

  const hour = date.getHours();

  // 3) Peak hours: 7–9 AM OR 5–7 PM
  const isPeak = (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19);

  // 4) Night-time: 8 PM–6 AM
  const isNight = hour >= 20 || hour < 6;

  // 5) Apply surcharges
  if (isPeak) price *= SURGE_PEAK;
  if (isNight) price *= SURGE_WEATHER;
  if (isBadWeather) price *= SURGE_WEATHER;

  // 6) Round to nearest naira
  const finalPrice = Math.round(price / 100) * 100;

  return { price: finalPrice, riderPay: finalPrice * RIDER_PAY };
}

module.exports = { calculateDeliveryPrice };
