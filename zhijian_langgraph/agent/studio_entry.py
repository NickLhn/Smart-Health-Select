from __future__ import annotations

from agent.graph import build_graph
from agent.settings import load_settings

graph = build_graph(load_settings())
