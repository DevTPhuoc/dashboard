# controllers/labs_controller.py
from controllers.base_controller import BaseCRUDController
from models.models import (RepairHistory,db,Device,Team,Lab)
from flask import request, jsonify
from sqlalchemy import desc,func



def create_blueprint():
    ctrl = BaseCRUDController("historyrepair", RepairHistory)
    ctrl.add_filter_route("DeviceID", filter_type=int)
    # @ctrl.blueprint.route("/device_history", methods=["POST"])
    # def device_history():
    #     try:
    #         # Lấy tham số từ query string
    #         team_id = request.args.get("team_id", type=int)
    #         lab_id = request.args.get("lab_id", type=int)
    #         limit = request.args.get("limit", default=10, type=int)

    #         query = (
    #             db.session.query(
    #                 Device.id.label("DeviceID"),
    #                 Device.DeviceName,
    #                 Team.TeamName,
    #                 Lab.LabName,
    #                 func.count(RepairHistory.id).label("RepairCount"),
    #                 func.sum(RepairHistory.Cost).label("TotalCost")
    #             )
    #             .join(RepairHistory, RepairHistory.DeviceID == Device.id)
    #             .join(Team, Device.TeamID == Team.id)
    #             .join(Lab, Team.LabID == Lab.id)
    #             .group_by(Device.id, Device.DeviceName, Team.TeamName, Lab.LabName)
    #             .order_by(desc("RepairCount"))
    #         )
            

    #         # Nếu có team_id thì lọc theo team
    #         if team_id:
    #             query = query.filter(Device.TeamID == team_id)

    #         # Nếu có lab_id thì lọc theo lab
    #         if lab_id:
    #             query = query.filter(Team.LabID == lab_id)

    #         top_devices = query.limit(limit).all()

    #          # Query tổng chi phí tất cả (không phụ thuộc limit)
    #         total_cost_query = (
    #             db.session.query(func.sum(RepairHistory.Cost).label("GrandTotalCost"))
    #             .join(Device, RepairHistory.DeviceID == Device.id)
    #             .join(Team, Device.TeamID == Team.id)
    #             .join(Lab, Team.LabID == Lab.id)
    #         )
    #         if team_id:
    #             total_cost_query = total_cost_query.filter(Device.TeamID == team_id)
    #         if lab_id:
    #             total_cost_query = total_cost_query.filter(Team.LabID == lab_id)

    #         grand_total_cost = total_cost_query.scalar() or 0.0

    #         # Trả về JSON
    #         return jsonify({
    #         "top_devices": [dict(r._asdict()) for r in top_devices],
    #         "grand_total_cost": grand_total_cost
    #     })

    #     except Exception as e:
    #         db.session.rollback()
    #         return jsonify({"error": str(e)}), 500


    return ctrl.blueprint