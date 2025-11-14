# controllers/labs_controller.py
from controllers.base_controller import BaseCRUDController
from models.models import Approval
from flask import jsonify

def create_blueprint():
    ctrl = BaseCRUDController("approvals", Approval)
    ctrl.add_filter_route("RequestID", filter_type=int)
    # Router lọc theo RequestID và status: 
    @ctrl.blueprint.route("/get_status_confirm_for_lab/<int:request_id>", methods=["GET"])
    def get_status_confirm_for_lab(request_id):
        items = Approval.query.filter_by(RequestID=request_id, Status='Approved').first()
        if not items:
            return jsonify({})
        return jsonify(items.to_dict())
    return ctrl.blueprint
   
    