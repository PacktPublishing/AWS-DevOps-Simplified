from flask import Flask, render_template, request, url_for, redirect
from pymongo import MongoClient
from markupsafe import escape
from bson.objectid import ObjectId
from prometheus_flask_exporter import PrometheusMetrics

import logging
import sys

root = logging.getLogger()
root.setLevel(logging.DEBUG)

handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
root.addHandler(handler)

app = Flask(__name__)
metrics = PrometheusMetrics(app)
mongodb_client = MongoClient('localhost', 27017)
todos_db = mongodb_client.flask_db
todos_collection = todos_db["todos"]

@app.route("/", methods = ('GET', 'POST'))
def todos():
    if (request.method == "POST"):
        logging.info('Received a %s request for %s ', request.method, request.url)
        todo_item = request.form["todo"]
        todo_type = request.form["tasktype"]
        try:
            logging.info('Submitting \'%s\' task: \'%s\' to persistent storage ',request.form["tasktype"], request.form["todo"])
            todos_collection.insert_one({"todo": todo_item, "tasktype": todo_type})
            return redirect(url_for('todos'))
        except Exception as e:
            pass
    all_todos = todos_collection.find()
    return render_template('index.html', all_todos = all_todos)

@app.post("/<id>/delete")
def delete(id):
    # HTML does not support DELETE method type in form submissions, only PUT and GET
    if (request.method == "POST"):
        logging.info('Deleting task represented by ID: \'%s\' ',ObjectId(id))
        todos_collection.delete_one({"_id": ObjectId(id)})
        return redirect(url_for('todos'))
