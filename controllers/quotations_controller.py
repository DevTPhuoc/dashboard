# controllers/quotations_controller.py
from controllers.base_controller import BaseCRUDController
from flask import request, jsonify
from models.models import Quotation, RepairRequest, Approval, db, Purchase
from datetime import datetime

def create_blueprint():
    ctrl = BaseCRUDController("quotations", Quotation)

    # Approve a quotation (EM/LM)
    def approve_quotation(quotation_id):
        q = Quotation.get_by_id(quotation_id)
        if not q:
            return jsonify({"error": "Quotation not found"}), 404

        data = request.json or {}
        role = data.get("role")  # EM or LM
        decision = data.get("decision")  # Approved/Rejected
        comment = data.get("comment", "")

        if role not in ("EM", "LM"):
            return jsonify({"error": "role must be EM or LM"}), 400
        if decision not in ("Approved", "Rejected"):
            return jsonify({"error": "decision must be Approved or Rejected"}), 400

        # create/update Approval record for this RequestID and step QuotationApproval
        # if exists for this role and step+request, update it.
        appr = Approval.query.filter_by(RequestID=q.RequestID, Step="QuotationApproval", ApproverRole=role).first()
        if not appr:
            appr = Approval(RequestID=q.RequestID, Step="QuotationApproval", ApproverRole=role)
        appr.Decision = decision
        appr.DecisionDate = datetime.utcnow()
        appr.Comment = comment
        appr.add()

        # Check if both EM & LM have Approved this same quotation
        em = Approval.query.filter_by(RequestID=q.RequestID, Step="QuotationApproval", ApproverRole="EM").first()
        lm = Approval.query.filter_by(RequestID=q.RequestID, Step="QuotationApproval", ApproverRole="LM").first()

        if em and lm and em.Decision=="Approved" and lm.Decision=="Approved":
            # we need to ensure they both approved the same Option chosen.
            # Simplest approach: When approving quotation, the approver indicates chosen OptionNo in comment or payload.
            # For simplicity, we assume approvers intend to approve this quotation q.
            # Set quotation status approved and create Purchase
            q.Status = "Approved"
            db.session.commit()

            # Create Purchase record (procurement step might normally do this)
            p = Purchase(QuotationID=q.id, RequestID=q.RequestID, TotalCost=q.TotalCost, Status="Ordered")
            p.add()

            # Update request status and timeline
            req = RepairRequest.get_by_id(q.RequestID)
            if req:
                req.Status = "Purchased"
                # append timeline
                tl = req.Timeline or []
                tl.append({"event":"QuotationApprovedAndPurchased", "quotation_id": q.id, "time": datetime.utcnow().isoformat()})
                req.Timeline = tl
                db.session.commit()

            return jsonify({"message": "Quotation approved by both EM & LM, purchase created", "purchase": p.to_dict()})

        return jsonify({"message": "Approval recorded", "approval": appr.to_dict()})

    ctrl.add_custom_route(
        rule="/<int:quotation_id>/approve",
        endpoint="approve_quotation",
        view_func=approve_quotation,
        methods=["POST"]
    )
    return ctrl.blueprint
