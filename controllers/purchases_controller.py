# controllers/purchases_controller.py
from controllers.base_controller import BaseCRUDController
from models.models import Purchase

def create_blueprint():
    return BaseCRUDController("purchases", Purchase).blueprint
