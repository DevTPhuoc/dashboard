# controllers/labs_controller.py
from controllers.base_controller import BaseCRUDController
from models.models import Technician

def create_blueprint():
    return BaseCRUDController("technicians", Technician).blueprint
