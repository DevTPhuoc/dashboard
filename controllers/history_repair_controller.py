# controllers/labs_controller.py
from controllers.base_controller import BaseCRUDController
from models.models import RepairHistory

def create_blueprint():
    ctrl = BaseCRUDController("historyrepair", RepairHistory)
    ctrl.add_filter_route("DeviceID", filter_type=int)
    return ctrl.blueprint