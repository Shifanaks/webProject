from flask import Flask, request, jsonify, render_template, redirect, url_for, session
import joblib
import pandas as pd
import numpy as np
from map import mappings, get_order_details  # Import mappings and order details function
from database import db, User, Prediction  # Import database and model
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from xgboost import XGBRegressor

# Initialize Flask app
app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

import os
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "your_fallback_secret")

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"  # Stores session in a file instead of memory
# Configure multiple SQLite databases
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"  # Default database (for User Authentication)
app.config["SQLALCHEMY_BINDS"] = {
    "predictions": "sqlite:///predictions.db"  # Additional database for storing predictions
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database with Flask app
db.init_app(app)

# Ensure database tables are created
with app.app_context():
    db.create_all()  # Creates tables for both 'users.db' and 'predictions.db'

# Load the trained model
model = joblib.load("best_xgboost_model_tuned_noscaler.pkl")

# Feature order used in training
try:
    feature_order = model.feature_names_in_.tolist()
except AttributeError:
    feature_order = [
        "Order Subtotal Amount", "Order Number", "Order Total Tax Amount",
        "Item Cost", "Shipping Method Title", "Payment Method Title",
        "Cart Discount Amount", "State Code (Billing)"
    ]

@app.route("/")
def root():
    return render_template("login.html") # Always redirects to login first

@app.route("/home")
def home():
    if "user" not in session:  # Check if user is logged in
        return redirect(url_for("login"))  
    return render_template("index.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]

        # Check if password and confirm password match
        if password != confirm_password:
            return "Passwords do not match", 400

        # Ensure terms are agreed to
        if "terms" not in request.form:
            return "You must agree to the terms and conditions", 400

        # Check if the user already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return "Username already exists. Please choose a different username or login.", 400

        # Create a new user
        hashed_password = generate_password_hash(password)
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        # Store username in session (for authentication purposes)
        session["user"] = username  

        return redirect(url_for('predict'))  # Redirect after successful registration
    return render_template('register.html')

@app.route("/login", methods=["GET", "POST"])
def login():
    if "user" in session:  # If user is already logged in, redirect to home
        return render_template("index.html")
        
    if request.method == "POST":
        if request.is_json:
            username = request.json.get("username")  # Get JSON data
            password = request.json.get("password")
        else:
            # Handle form data (from traditional form submission)
            username = request.form.get("username")
            password = request.form.get("password")

        # Find user in database
        user = User.query.filter_by(username=username).first()
        
        # Check if user exists and password is correct
        if user and check_password_hash(user.password, password):
            # Store username in session
            session["user"] = username
            
            # Handle different response types
            if request.is_json:
                return jsonify({"success": True, "message": "Login successful"}), 200
            else:
                # Use redirect to avoid form resubmission issues
                return render_template("index.html")
        else:
            if request.is_json:
                return jsonify({"success": False, "message": "Invalid username or password"}), 401
            else:
                return render_template("login.html", error="Invalid username or password")

    return render_template("login.html")

@app.route("/logout")
def logout():
    session.pop("user", None)  # Remove user session
    return redirect(url_for("login"))  # Redirect to login page

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/contact")
def contact():
    return render_template("contact.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        print("Received Data:", data)  # Debugging step

        # ✅ Convert input data to DataFrame
        df = pd.DataFrame([data])

        # ✅ Apply mappings to categorical columns
        categorical_columns = ["Shipping Method Title", "Payment Method Title", "State Code (Billing)"]
        for col in categorical_columns:
            if col in df.columns:
                df[col] = df[col].map(mappings.get(col, {})).fillna(-1).astype("Int64")  # Convert to numeric

        # ✅ Reorder features to match model input
        df = df.reindex(columns=feature_order, fill_value=0)

        # ✅ Make prediction
        predicted_price = model.predict(df)[0]

        # ✅ Save prediction to database
        new_entry = Prediction(
            order_number=df["Order Number"][0] if "Order Number" in df else None,
            order_subtotal=df["Order Subtotal Amount"][0],
            order_tax=df["Order Total Tax Amount"][0],
            item_cost=df["Item Cost"][0],
            shipping_method=data.get("Shipping Method Title"),
            payment_method=data.get("Payment Method Title"),
            discount_amount=df["Cart Discount Amount"][0],
            state_code=data.get("State Code (Billing)"),
            predicted_price=round(float(predicted_price), 2),
        )
        db.session.add(new_entry)
        db.session.commit()

        return jsonify({"Predicted Price": round(float(predicted_price), 2)})

    except Exception as e:
        print("Error:", str(e))  # Debugging step
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)