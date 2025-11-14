# models.py
from datetime import datetime
from sqlalchemy import CheckConstraint
from app import db
from sqlalchemy import text
from sqlalchemy.dialects.sqlite import JSON
class BaseModel(db.Model):
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    def add(self):
        db.session.add(self)
        db.session.commit()
        return self

    @classmethod
    def get_all(cls):
        return cls.query.all()

    @classmethod
    def get_by_id(cls, id_):
        return cls.query.get(id_)

    def update(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        db.session.commit()
        return self

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    def to_dict(self):
        data = {}
        for c in self.__table__.columns:
            val = getattr(self, c.name)
            if isinstance(val, datetime):
                val = val.isoformat()
            data[c.name] = val
        return data


class Lab(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "labs"
    LabName = db.Column(db.String(255), nullable=False)

class Team(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "teams"
    TeamName = db.Column(db.String(255), nullable=False)
    LabID = db.Column(db.Integer, db.ForeignKey("labs.id"), nullable=False)
    lab = db.relationship("Lab", backref="teams")
    
    def to_dict(self):
        data = super().to_dict()
        data.update({
            "LabName": self.lab.LabName if self.lab else None
        })
        return data


class Device(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "devices"
    DeviceName = db.Column(db.String(255), nullable=False)
    DeviceCode = db.Column(db.String(100), unique=True, nullable=False)
    TeamID = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False)
    Status = db.Column(db.String(50), nullable=False, default="available")
    TotalRepairCount = db.Column(db.Integer, default=0)
    TotalRepairCost = db.Column(db.Float, default=0.0)
    team = db.relationship("Team", backref="devices")
    repair_requests = db.relationship("RepairRequest", backref="devices", cascade="all, delete-orphan")
    Model= db.Column(db.String, nullable=True)
    Branch= db.Column(db.String, nullable=True)
    ImportDate= db.Column(db.String, nullable=True)
    def to_dict(self):
        data = super().to_dict()
        data.update({
            "TeamName": self.team.TeamName if self.team else None,
            "LabName": self.team.lab.LabName if self.team and self.team.lab else None
        })
        return data

class Technician(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "technician"
    Name=db.Column(db.String(255), nullable=False)


#phước thêm vào 
class PA(db.Model):
    __bind_key__ = 'cmms'
    __tablename__ = "pa"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("repair_requests.id"), unique=True, nullable=False)
    approved_option_id = db.Column(db.Integer, db.ForeignKey("quote_options.id"), nullable=True)

    PA_no = db.Column(db.String(100), nullable=False, unique = True)
    PO_no = db.Column(db.String(100), nullable=True, unique = True)
    Delivery = db.Column(db.String, nullable=True)
    note = db.Column(db.Text, nullable=True)

    request = db.relationship("RepairRequest", back_populates="pa", uselist=False)
    approved_option = db.relationship("QuoteOption")

    def to_dict(self):
        return {
            "id": self.id,
            "request_id": self.request_id,
            "approved_option_id": self.approved_option_id,
            "PA_no": self.PA_no,
            "PO_no": self.PO_no,
            "Delivery": self.Delivery,
            "note": self.note
        }

    __bind_key__ = 'cmms'
    __tablename__ = "pa"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("repair_requests.id"), unique=True, nullable=False)
    PA_no = db.Column(db.String(100), nullable=False)
    PO_no = db.Column(db.String(100), nullable=True)
    Delivery = db.Column(db.String, nullable=True)
    note = db.Column(db.Text, nullable=True)

    # One-to-One với RepairRequest
    request = db.relationship("RepairRequest", back_populates="pa", uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "request_id": self.request_id,
            "PA_no": self.PA_no,
            "PO_no": self.PO_no,
            "Delivery": self.Delivery,
            "note": self.note
        }
class RepairRequest(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "repair_requests"
    id = db.Column(db.Integer, primary_key=True)
    RequestedBy = db.Column(db.String, nullable=True)
    DeviceID = db.Column(db.Integer, db.ForeignKey("devices.id"), nullable=True)
    RequestDate = db.Column(db.String)
    LabID = db.Column(db.Integer, db.ForeignKey("labs.id"), nullable=True)
    TeamID = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=True)
    Description = db.Column(db.Text, nullable=True)
    Status = db.Column(db.String(50), nullable=False)
    Priority=db.Column(db.Boolean, nullable=True)
    TechName= db.Column(db.Text, nullable=True)
    RejectType = db.Column(db.String(50))
    Timeline = db.Column(JSON, nullable=True, server_default=text("'[]'"))
    ChangeByUsername = db.Column(db.Text, nullable=True)
    NoteByUsername = db.Column(db.Text, nullable=True)

    @property
    def Timeline_safe(self):
        # Nếu Timeline rỗng hoặc None, trả về []ư
        if not self.Timeline:
            return []
        return self.Timeline

    lab = db.relationship("Lab")
    team = db.relationship("Team")
    pa = db.relationship("PA", back_populates="request", uselist=False)

    def to_dict(self):
        data = super().to_dict()
        data.update({
            # "RequestedBy": self.RequestedBy.FullName if self.RequestedBy else None,
            "DeviceName": self.devices.DeviceName if self.devices else None,
            "LabName": self.lab.LabName if self.lab else None,
            "TeamName": self.team.TeamName if self.team else None,
            "Timeline": self.Timeline or []
    })
        return data
class DisposalDocument(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = 'disposal_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('repair_requests.id'))
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    upload_date = db.Column(db.String, nullable=True)
    
    # Relationship
    repair_request = db.relationship('RepairRequest', backref=db.backref('disposal_documents', lazy=True))
class RepairHistory(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "repair_history"
    DeviceID = db.Column(db.Integer, db.ForeignKey("devices.id"), nullable=False)
    RequestID = db.Column(db.Integer, db.ForeignKey("repair_requests.id"), nullable=True)
    RepairDate = db.Column(db.String, default=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    RepairType = db.Column(db.String(50))  # Internal/External/Replace
    Cost = db.Column(db.Float, default=0.0)
    Notes = db.Column(db.Text, nullable=True)
    TechName= db.Column(db.Text, nullable=True)
    device = db.relationship("Device")
    request = db.relationship("RepairRequest")


class Approval(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "approvals"
    RequestID = db.Column(db.Integer, db.ForeignKey("repair_requests.id"), nullable=False)
    Status = db.Column(db.String(50), nullable=False)  # RequestApproval, QuotationApproval
    Comment = db.Column(db.Text, nullable=True)
    lm_note= db.Column(db.Text, nullable=True)
    em_note= db.Column(db.Text, nullable=True)
    lm_user_id = db.Column(db.Integer, nullable=True)
    em_user_id = db.Column(db.Integer, nullable=True)
    lm_date = db.Column(db.String, nullable=True)
    em_date = db.Column(db.String, nullable=True)
    request = db.relationship("RepairRequest", backref="approvals")

class RepairStatusHistory(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "repair_status_history"
    repair_request_id = db.Column(db.Integer, db.ForeignKey("repair_requests.id"), nullable=False)
    old_status = db.Column(db.Text , nullable=False)
    new_status = db.Column(db.Text, nullable=False)
    change_timestamp = db.Column(db.String)
    changed_by = db.Column(db.Integer, nullable=False)  # ID người thay đổi
    notes = db.Column(db.Text, nullable=False)
    
    # Relationship với RepairRequest
    repair_request = db.relationship("RepairRequest", backref="status_history")  
    

class Purchase(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "purchases"
    QuotationID = db.Column(db.Integer, db.ForeignKey("quotations.id"), nullable=False)
    RequestID = db.Column(db.Integer, db.ForeignKey("repair_requests.id"), nullable=False)
    PurchaseDate = db.Column(db.String, default=datetime.utcnow)
    TotalCost = db.Column(db.Float, nullable=False)
    Status = db.Column(db.String(50), default="Ordered")  # Ordered, Received, Paid, Completed
    quotation = db.relationship("Quotation")
    request = db.relationship("RepairRequest")
    
class Quotation(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = 'quotations'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    RequestID = db.Column(db.Integer, db.ForeignKey('repair_requests.id'), nullable=False)

    status = db.Column(db.String(20), default="Pending")        
    approved_option_no = db.Column(db.Integer, nullable=True)  
    lm_apr_date = db.Column(db.String, nullable=True) 
    em_apr_date = db.Column(db.String, nullable=True)  

    CreatedDate = db.Column(db.String, default=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    user1_id = db.Column(db.String(20), nullable=True)
    user2_id = db.Column(db.String(20), nullable=True)
    # relationship tới các option
    options = db.relationship("QuoteOption", backref="quotation", cascade="all, delete-orphan")
    def options_safe(self):
            if not self.options:
                return []
            return self.options
    def __repr__(self):
        return f"<Quotation id={self.id}, request_id={self.RequestID}, status={self.status}, approved_option={self.approved_option_no}>"

class QuoteOption(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "quote_options"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    quotation_id = db.Column(db.Integer, db.ForeignKey("quotations.id"), nullable=False)
    option_no = db.Column(db.Integer, nullable=False)             # số thứ tự option (1,2,3,...)
  
    vendor_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=True)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False)
    file_url = db.Column(db.String(255))
    quotation_note = db.Column(db.Text)
    em_note = db.Column(db.Text)
    lab_note = db.Column(db.Text)

    status = db.Column(db.String(20))          # Pending / Approved / Rejected

    @property
    def total_cost(self):
        qty = float(self.quantity) if self.quantity is not None else 1.0
        price = float(self.unit_price) if self.unit_price is not None else 1.0
        return qty * price


    def __repr__(self):
        return f"<QuoteOption id={self.id}, quotation_id={self.quotation_id}, option_no={self.option_no}, vendor={self.vendor_name}, status={self.status}>"

class Status(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "status"
    StatusName = db.Column(db.String, nullable=False, unique=True)
    id = db.Column(db.Integer, primary_key=True)
    
class QuotationHistory(BaseModel):
    __bind_key__ = 'cmms'
    __tablename__ = "quotation_history"
    history_delete = db.Column(db.String, default="[]")
    id_request = db.Column(db.Integer, db.ForeignKey("repair_requests.id"), nullable=False, unique=True)
