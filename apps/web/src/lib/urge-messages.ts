/**
 * Built-in motivational messages shown when the user logs an urge, to help them
 * resist the temptation and protect their streak. A static set for the MVP; could
 * later be customizable per behavior.
 */
export const URGE_MESSAGES = [
  'This urge is temporary. Your streak is not.',
  'Ride it out — cravings peak and fade within minutes.',
  "You've come too far to hand it back now.",
  'Future you will be grateful you held on.',
  'One urge resisted is one more win on the board.',
  'Breathe. The feeling passes; the progress stays.',
  'You are stronger than a single moment of temptation.',
  'Distract, delay, decide — and the urge loses its grip.',
];

/** A random motivational message. */
export function randomUrgeMessage(): string {
  return URGE_MESSAGES[Math.floor(Math.random() * URGE_MESSAGES.length)];
}
