const manualMode = require('../services/manualModeService');
const handle = (operation, { review = false, status = false } = {}) => async (req,res) => {
  try {
    const scope = manualMode.scopeValue(req.body?.scope ?? req.query.scope);
    if (review && !req.operator?.admin) {
      return res.status(403).json({ success: false, message: 'You cannot manage manual mode for this scope.' });
    }
    const result = await operation(req,scope);
    return res.status(status || result.status ? 200 : 409).json({ success: result.status, message: result.message, data: result.data || null });
  } catch (error) {
    if (!error.status) console.error('Manual mode error:', error);
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Manual mode operation failed.' });
  }
};
exports.requestManualMode = handle((req,scope) => manualMode.requestManualMode(req.user.id,req.body.reason,scope));
exports.approveManualMode = handle((req,scope) => manualMode.approveManualMode(req.body.id,req.body.expires_at,scope,req.user.id), { review: true });
exports.rejectManualMode = handle((req,scope) => manualMode.rejectManualMode(req.body.id,req.body.reason,scope,req.user.id), { review: true });
exports.getAllManualModeRequests = handle((req,scope) => manualMode.getAllManualModeRequests(scope), { review: true });
exports.currentUserMode = handle((req,scope) => manualMode.isUserInManualMode(req.user.id,scope), { status: true });
exports.extendManualMode = handle((req,scope) => manualMode.extendManualMode(req.body.id,req.body.expires_at,scope), { review: true });
exports.endManualModeSession = handle((req,scope) => manualMode.endManualModeSession(req.body.id,scope), { review: true });
exports.postManualModeLog = handle((req,scope) => {
  if (scope !== 'weighbridge') throw Object.assign(new Error('Use the gate pass Create action for gate captures.'), { status: 400 });
  return manualMode.postManualModeLog(req.body.truck,req.body.camera_id,req.user.id);
});
