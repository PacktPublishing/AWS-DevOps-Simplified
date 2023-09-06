from flask import Flask, render_template, request, url_for, redirect
from pymongo import MongoClient
from markupsafe import escape
from bson.objectid import ObjectId

# Initialize global variables for MongoDB connection
app = Flask(__name__)
mongodb_client = MongoClient('localhost', 27017)
todos_db = mongodb_client.flask_db
todos_collection = todos_db["todos"]

@app.route("/", methods = ('GET', 'POST'))
def todos():
    if (request.method == "POST"):
        todo_item = request.form["todo"]
        todo_type = request.form["tasktype"]
        todos_collection.insert_one({"todo": todo_item, "tasktype": todo_type})
        return redirect(url_for('todos'))
    all_todos = todos_collection.find()
    return render_template('index.html', all_todos = all_todos)

@app.post("/<id>/delete")
def delete(id):
    # HTML does not support DELETE method type in form submissions, only PUT and GET
    if (request.method == "POST"):
        todos_collection.delete_one({"_id": ObjectId(id)})
        return redirect(url_for('todos'))
