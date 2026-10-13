import { User } from '../models/User.js';
import { Reservation } from '../models/Reservation.js';
import { AppError, ok } from '../utils/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/auditService.js';
import { pick } from '../middleware/validate.js';

export const listUsers = asyncHandler(async (req, res) => {
  const filter = { deletedAt: null };
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) filter.$or = [{ name: new RegExp(req.query.q, 'i') }, { email: new RegExp(req.query.q, 'i') }];
  ok(res, await User.find(filter).sort({ createdAt: -1 }).limit(200));
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.deletedAt) throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');
  const reservations = await Reservation.find({ guest: user._id }).sort({ createdAt: -1 }).limit(50);
  ok(res, { user, reservations });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) throw new AppError(403, 'Forbidden.', 'FORBIDDEN');
  const user = await User.findById(req.params.id);
  if (!user || user.deletedAt) throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');
  const fields = req.user.role === 'admin' ? ['name', 'email', 'phone', 'address', 'role'] : ['name', 'phone', 'address'];
  const updates = pick(req.body, fields);
  if (updates.role && req.user._id.toString() === req.params.id && updates.role !== req.user.role) {
    throw new AppError(403, 'You cannot change your own role.', 'SELF_ROLE_CHANGE');
  }
  Object.assign(user, updates);
  if (updates.role) user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  await audit(req, 'user.update', 'User', user._id);
  ok(res, user, 'User updated.');
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+tokenVersion');
  if (!user || user.deletedAt) throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');
  if (user._id.toString() === req.user._id.toString()) throw new AppError(400, 'You cannot deactivate your own account.', 'SELF_DEACTIVATE');
  user.isActive = Boolean(req.body.isActive);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  await audit(req, 'user.status', 'User', user._id, { isActive: user.isActive });
  ok(res, user, 'User status updated.');
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+tokenVersion');
  if (!user || user.deletedAt) throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');
  if (user._id.toString() === req.user._id.toString()) throw new AppError(400, 'You cannot delete your own account.', 'SELF_DELETE');
  user.deletedAt = new Date();
  user.isActive = false;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  await audit(req, 'user.soft_delete', 'User', user._id);
  ok(res, null, 'User deactivated.');
});

