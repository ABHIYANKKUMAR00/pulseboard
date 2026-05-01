/**
 * Task-specific RBAC middleware.
 *
 * Two exported middlewares:
 *   adminOnly        – rejects non-admin callers with 403
 *   memberStatusOnly – members may only change `status`; any other field triggers 403
 */

const MEMBER_FORBIDDEN_FIELDS = [
  'title', 'description', 'priority', 'dueDate',
  'assignedTo', 'tags', 'projectId', 'order'
];

const VALID_STATUSES = ['todo', 'in-progress', 'done'];

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Only admins can perform this action.',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

const memberStatusOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Admins pass through without restriction
  if (req.user.role === 'admin') return next();

  // --- Member path ---
  const attemptedForbidden = MEMBER_FORBIDDEN_FIELDS.filter(f => req.body[f] !== undefined);

  if (attemptedForbidden.length > 0) {
    return res.status(403).json({
      message: `Members can only update task status. Restricted field(s): ${attemptedForbidden.join(', ')}.`,
      code: 'STATUS_ONLY',
      restrictedFields: attemptedForbidden
    });
  }

  if (req.body.status === undefined) {
    return res.status(403).json({
      message: 'Members can only update task status.',
      code: 'STATUS_ONLY'
    });
  }

  if (!VALID_STATUSES.includes(req.body.status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`
    });
  }

  // Guarantee body contains nothing else — defence-in-depth
  req.body = { status: req.body.status };
  next();
};

module.exports = { adminOnly, memberStatusOnly };
