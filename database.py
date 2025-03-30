from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy instance (used for both databases)
db = SQLAlchemy()

# User Model (Stored in `users.db`)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

# Prediction Model (Stored in `predictions.db`)
class Prediction(db.Model):
    __bind_key__ = "predictions"  # Uses `predictions.db`
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50))
    order_subtotal = db.Column(db.Float)
    order_tax = db.Column(db.Float)
    item_cost = db.Column(db.Float)
    shipping_method = db.Column(db.String(50))
    payment_method = db.Column(db.String(50))
    discount_amount = db.Column(db.Float)
    state_code = db.Column(db.String(10))
    predicted_price = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())

# Function to initialize databases
def initialize_databases(app):
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"  # User DB
    app.config["SQLALCHEMY_BINDS"] = {"predictions": "sqlite:///predictions.db"}  # Prediction DB
    db.init_app(app)
    from flask import Flask

    app = Flask(__name__)
    initialize_databases(app)
    with app.app_context():
        db.create_all()
        print("Database initialized successfully!")
        print("Tables available:", db.engine.table_names())