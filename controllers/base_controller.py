# controllers/base_controller.py
from flask import Blueprint, request, jsonify
from sqlalchemy import String
from app import db
from functools import wraps

class BaseCRUDController:
    def __init__(self, name, model):
        self.model = model
        
        self.blueprint = Blueprint(name, __name__)
        self.custom_routes = []
        self.register_routes()

    def register_routes(self):
        bp = self.blueprint
        model = self.model

        @bp.route("/", methods=["GET"])
        def get_all():
            items = model.get_all()
            return jsonify([item.to_dict() for item in items])

        @bp.route("/<int:item_id>", methods=["GET"])
        def get_one(item_id):
            item = model.get_by_id(item_id)
            if not item:
                return jsonify({"error": "Not found"}), 404
            return jsonify(item.to_dict())

        @bp.route("/", methods=["POST"])
        def create():
            data = request.json or {}
            item = model(**data)
            item.add()
            return jsonify(item.to_dict()), 201

        @bp.route("/<int:item_id>", methods=["PUT"])
        def update(item_id):
            item = model.get_by_id(item_id)
            if not item:
                return jsonify({"error": "Not found"}), 404
            item.update(**(request.json or {}))
            return jsonify(item.to_dict())

        @bp.route("/<int:item_id>", methods=["DELETE"])
        def delete(item_id):
            item = model.get_by_id(item_id)
            if not item:
                return jsonify({"error": "Not found"}), 404
            item.delete()
            return jsonify({"message": "Deleted"})

        for route in self.custom_routes:
            bp.add_url_rule(
                route['rule'],
                route['endpoint'],
                route['view_func'],
                methods=route.get('methods', ['GET'])
            )

    def add_custom_route(self, rule, endpoint, view_func, methods=None):
        if methods is None:
            methods = ['GET']

        self.blueprint.add_url_rule(
            rule, endpoint, view_func, methods=methods
        )

    def add_filter_route(self, filter_field, filter_type=int):
        def filter_view():
            filter_value = request.args.get(filter_field)
            if not filter_value:
                return jsonify({"error": f"Missing {filter_field} parameter"}), 400

            try:
                if filter_type == int:
                    filter_value = int(filter_value)
                elif filter_type == str:
                    filter_value = str(filter_value)
            except ValueError:
                return jsonify({"error": f"Invalid {filter_field} value"}), 400

            items = self.model.query.filter_by(**{filter_field: filter_value}).all()
            return jsonify([item.to_dict() for item in items])

        route_name = f"get_by_{filter_field}"
        self.add_custom_route(
            rule=f"/by_{filter_field}",
            endpoint=route_name,
            view_func=filter_view,
            methods=['GET']
        )
def add_filter_route(self, filter_field, filter_type=str):
    def filter_view():
        filter_value = request.args.get(filter_field)
        if not filter_value:
            return jsonify({"error": f"Missing {filter_field} parameter"}), 400

        try:
            # Convert filter value to appropriate type
            if filter_type == int:
                filter_value = int(filter_value)
            elif filter_type == str:
                filter_value = str(filter_value)
            elif filter_type == bool:
                filter_value = filter_value.lower() in ('true', '1', 'yes')
        except ValueError:
            return jsonify({"error": f"Invalid {filter_field} value"}), 400

        try:
            # Check if the filter field exists in the model
            if not hasattr(self.model, filter_field):
                return jsonify({"error": f"Field {filter_field} does not exist in model"}), 400
            
            # Build the filter query - sửa lỗi filter
            query = self.model.query.filter(getattr(self.model, filter_field) == filter_value)
            
            # Execute query
            items = query.all()
            
            return jsonify([item.to_dict() for item in items])
            
        except Exception as e:
            return jsonify({"error": f"Database query failed: {str(e)}"}), 500

    route_name = f"get_by_{filter_field}"
    self.add_custom_route(
        rule=f"/by_{filter_field}",
        endpoint=route_name,
        view_func=filter_view,
        methods=['GET']
    )

# Thêm route filter theo Status
