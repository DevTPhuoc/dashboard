from controllers.base_controller import BaseCRUDController
from models.models import RepairStatusHistory
from flask import request, jsonify

def create_blueprint():
    ctrl = BaseCRUDController("repair_requests_status_history", RepairStatusHistory)
    
    @ctrl.blueprint.route("/reject_info", methods=["POST"])
    def reject_info():
        try: 
            data = request.get_json()
            req_id = data.get("request_id")
            status = data.get("status", [])
            
            # filter trong RepairStatusHistory theo req_id và status lấy ra danh sách lý do từ chối mới nhất
            re_status_his = RepairStatusHistory.query.filter(
                RepairStatusHistory.repair_request_id == req_id,
                RepairStatusHistory.new_status.in_(status)
            ).order_by(RepairStatusHistory.change_timestamp.desc()).all()
            
            if not re_status_his:
                return jsonify({"error": "No data found"}) , 404
            
            result = {}
            for req in re_status_his:
                if req.new_status not in result:
                    result[req.new_status] = {
                        "Reason": req.notes,
                        "RejectAt": req.change_timestamp,
                        "RejectedBy": req.changed_by
                    }
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return ctrl.blueprint
