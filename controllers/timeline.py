# controllers/timeline.py
from controllers.base_controller import BaseCRUDController
from models.models import (RepairStatusHistory,db,RepairRequest)
from flask import request, jsonify
from sqlalchemy import desc
from datetime import datetime

def create_blueprint():
    
    ctrl = BaseCRUDController("timeline", RepairStatusHistory)
    ctrl.add_filter_route("repair_request_id", filter_type=int)
    @ctrl.blueprint.route("/Outlook_history/<int:request_id>", methods=["GET"])
    def Outlook_history(request_id):
        try:
            #lấy repair request id 
            request = RepairStatusHistory.query.filter_by(repair_request_id=request_id)\
                .order_by(desc(RepairStatusHistory.change_timestamp))\
                .all()   
            #lấy department
            if not request:
                return jsonify({'error': 'Repair request not found'}), 404
            data=[]
            for i in request:
                department_name = None
                if i.repair_request and i.repair_request.team and i.repair_request.team.lab:
                    department_name = i.repair_request.team.lab.LabName if i.repair_request.team.lab.LabName else None
                device_code=None
                if i.repair_request and i.repair_request.DeviceID : 
                    device_code = i.repair_request.devices.DeviceCode if i.repair_request.devices.DeviceCode else None
                data.append({
                    "repair_request_id" : i.repair_request_id,
                    "old_status": i.old_status,
                    "new_status":i.new_status ,
                    "change_timestamp":i.change_timestamp,
                    "changed_by":i.changed_by,
                    "notes":i.notes,
                    "department_name":department_name,
                    "device_code":device_code
                })
            return jsonify(data)
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
        
    return ctrl.blueprint


