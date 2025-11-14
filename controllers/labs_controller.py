# controllers/labs_controller.py
from controllers.base_controller import BaseCRUDController
from models.models import Lab

def create_blueprint():
    return BaseCRUDController("labs", Lab).blueprint
