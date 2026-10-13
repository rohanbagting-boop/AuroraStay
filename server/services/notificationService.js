import { Notification } from '../models/Notification.js';

export async function notify(user, type, title, message, relatedReservation) {
  return Notification.create({ user, type, title, message, relatedReservation });
}

