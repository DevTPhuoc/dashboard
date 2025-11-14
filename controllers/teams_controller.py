# controllers/teams_controller.py
from controllers.base_controller import BaseCRUDController
from models.models import Team

def create_blueprint():
    ctrl = BaseCRUDController("teams", Team)
    ctrl.add_filter_route("LabID", filter_type=int)
    return ctrl.blueprint
