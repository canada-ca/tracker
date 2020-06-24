#!/usr/bin/env bash

alembic --config=./migrations/alembic.ini upgrade head
