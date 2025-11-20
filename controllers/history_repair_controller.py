# controllers/labs_controller.py
from controllers.base_controller import BaseCRUDController
from models.models import RepairRequest, Device, Quotation, QuoteOption,PA, RepairStatusHistory, Team, Lab, Status, QuotationHistory, Approval,DisposalDocument,RepairHistory
from flask import request, jsonify
from sqlalchemy import desc,func
from sqlalchemy import  case, exists, func, or_, and_
from datetime import date, datetime
from datetime import datetime, timedelta
from app import db
from app.models import User







def create_blueprint():
    ctrl = BaseCRUDController("historyrepair", RepairHistory)
    @ctrl.blueprint.route("/device_history", methods=["POST"])
    def device_history():
        filters = request.get_json() or {}
        query = RepairRequest.query
        if filters.get("isQuotation") and filters["isQuotation"]:
            query = query.join(Approval, and_(Approval.RequestID == RepairRequest.id, Approval.Status != "Rejected"))

        if filters.get("id") and filters["id"][0] and filters["id"][0] != "":
            query = query.filter(RepairRequest.id.in_(filters["id"]))
        if filters.get("DeviceName") and filters["DeviceName"][0] and filters["DeviceName"][0] != "":
            device_names = [name for name in filters["DeviceName"] if name]
            query = query.join(Device, RepairRequest.DeviceID == Device.id).filter(
                or_(*[Device.DeviceName.ilike(f"%{name}%") for name in device_names])
            )
        if filters.get("RequestedBy") and filters["RequestedBy"][0] and filters["RequestedBy"][0] != "":
            requested_by_names = [name for name in filters["RequestedBy"] if name]
            query = query.filter(
                or_(*[RepairRequest.RequestedBy.ilike(f"%{name}%") for name in requested_by_names])
            )
        if filters.get("LabId") and filters["LabId"][0]:
            query = query.join(Lab, RepairRequest.LabID == Lab.id).filter(Lab.id.in_(filters["LabId"]))
        if filters.get("TeamId") and filters["TeamId"][0]:
            query = query.join(Team, RepairRequest.TeamID == Team.id).filter(Team.id.in_(filters["TeamId"]))
        if filters.get("status") and filters["status"][0] and filters["status"][0] != "":
            query = query.filter(RepairRequest.Status.in_(filters["status"]))
        from_date = None
        to_date = None    
        if filters.get("FromDate") and filters["FromDate"][0] and filters["FromDate"][0] != "":
            from_date = datetime.strptime(filters["FromDate"][0], "%Y-%m-%d")
            query = query.filter(RepairRequest.RequestDate >= from_date)
        if filters.get("ToDate") and filters["ToDate"][0] and filters["ToDate"][0] != "":
            to_date = datetime.strptime(filters["ToDate"][0], "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(RepairRequest.RequestDate < to_date)

        results = query.all()

        data = []
        # for req in results:
        #     device = Device.query.get(req.DeviceID)
        #     lab = Lab.query.get(req.LabID)
        #     team = Team.query.get(req.TeamID)
        #     user = User.query.get(req.RequestedBy)
        
       
        
            # --- tính tổng chi phí một lần ---
        total_costs = db.session.query(func.sum(RepairHistory.Cost)) \
            .join(RepairRequest, RepairHistory.RequestID == RepairRequest.id)
        total_pendings = db.session.query(func.count(RepairRequest.id)) \
            .filter(RepairRequest.Status!="Done")
    
        total_request=db.session.query(func.count(RepairRequest.id))
        team_filter=filters.get("TeamId") and filters["TeamId"]
        lab_filter=filters.get("LabId") and filters["LabId"]
        #FILLTER THEO LAB
        if team_filter:
            total_costs = total_costs.filter(RepairRequest.TeamID.in_(filters["TeamId"]))
            total_pendings = total_pendings.filter(RepairRequest.TeamID.in_(filters["TeamId"]))
            total_request=total_request.filter(RepairRequest.TeamID.in_(filters["TeamId"]))
        if lab_filter :
            total_costs = total_costs.filter(RepairRequest.LabID.in_(filters["LabId"]))
            total_pendings = total_pendings.filter(RepairRequest.LabID.in_(filters["LabId"]))
            total_request = total_request.filter(RepairRequest.LabID.in_(filters["LabId"]))
        
        # # filter theo ngày
        # if from_date:
        #     from_date_str = from_date.strftime("%Y-%m-%d")
        #     total_costs = total_costs.filter(RepairHistory.RepairDate >= from_date_str)
        #     total_pendings = total_pendings.filter(RepairRequest.RequestDate >= from_date)
        #     total_request  = total_request.filter(RepairRequest.RequestDate >= from_date)
        # if to_date:
        #     to_date_str = (to_date - timedelta(days=1)).strftime("%Y-%m-%d")
        #     total_costs = total_costs.filter(RepairHistory.RepairDate <= to_date_str)
        #     total_pendings = total_pendings.filter(RepairRequest.RequestDate < to_date)
        #     total_request  = total_request.filter(RepairRequest.RequestDate < to_date)
            
        grand_total = total_costs.scalar() or 0
        grand_total_pendings = total_pendings.scalar() or 0
        grand_total_requests=total_request.scalar() or 0

        # append thêm tổng chi phí vào mảng data
        data.append({
            "TotalCost": grand_total,
            "total_pendings": grand_total_pendings,
            "total_requests": grand_total_requests
        })
        return jsonify(data), 200
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