#!/bin/sh
set -e
python -m pip install --upgrade pip
pip install -r requirements.txt
exec gunicorn -w 2 -k gthread -t 120 -b 0.0.0.0:$PORT server:app