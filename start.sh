#!/bin/bash
export PYTHONPYCACHEPREFIX="$(dirname "$0")/.pycache"
python -m src
