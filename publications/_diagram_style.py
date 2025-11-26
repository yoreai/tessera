"""
Professional diagram styling for BlazeBuilder publications.
Provides consistent Plotly visualizations for academic papers.

Adapted from Abridge APEX publication standards.
"""
from __future__ import annotations

from typing import Dict, List
import math

import plotly.graph_objects as go

# Standard colors for BlazeBuilder diagrams
COLORS = {
    'blue': '#64b5f6',      # Spatial/Orchestration
    'teal': '#4db6ac',      # Data Flow/Processing
    'orange': '#ffb74d',    # Transformation/Risk
    'purple': '#ba68c8',    # Analytics/ML
    'green': '#66bb6a',     # Success/Quality
    'red': '#ef5350',       # Fire/Alert
    'gray': '#78909c',      # Infrastructure
}

TITLE_FONT = dict(size=13, family="Helvetica", color="#2c3e50")


def _compute_positions(num_stages: int, start_x: float = 1.2, step: float = 2.2) -> List[float]:
    return [start_x + i * step for i in range(num_stages)]


def _wrap_text(text: str, max_chars: int) -> str:
    """Wrap text at spaces to not exceed roughly max_chars per line."""
    words = text.split()
    if not words:
        return text

    lines: List[str] = []
    current = words[0]
    for w in words[1:]:
        if len(current) + 1 + len(w) <= max_chars:
            current += " " + w
        else:
            lines.append(current)
            current = w
    lines.append(current)
    return "<br>".join(lines)


def render_boxes_diagram(
    stages: List[Dict[str, object]],
    title: str,
    outfile: str,
    *,
    box_half_width: float | None = None,
    top_y: float = 2.0,
    bottom_y: float = 0.4,
    arrow_y: float = 1.1,
    scale: float = 1.0,
) -> None:
    """
    Render a left-to-right boxes diagram with consistent BlazeBuilder style.

    Each stage dict should include: 'name' (str), 'items' (List[str]), 'color' (hex).
    Optional 'x' may be provided; otherwise positions are spaced evenly.
    Writes a single SVG to `outfile`.

    Example:
        stages = [
            {'name': 'Stage 1', 'items': ['Item A', 'Item B'], 'color': '#64b5f6'},
            {'name': 'Stage 2', 'items': ['Item C', 'Item D'], 'color': '#4db6ac'},
        ]
        render_boxes_diagram(stages, "Pipeline", "/tmp/diagram.svg")
    """
    num = len(stages)
    if box_half_width is None:
        box_half_width = 0.85 if num <= 4 else 0.8

    label_font_size = int(round((14 if num <= 4 else 13) * scale))
    item_font_size = int(round((12 if num <= 4 else 11) * scale))
    line_step = 0.25 if num <= 4 else 0.22

    # Derive x positions
    positions: List[float]
    if all("x" in s for s in stages):
        positions = [float(s["x"]) for s in stages]
    else:
        start_x = 1.2
        step = 2.2 if num <= 4 else 2.1
        positions = _compute_positions(len(stages), start_x=start_x, step=step)

    fig = go.Figure()

    # Draw boxes and annotations
    for stage, x in zip(stages, positions):
        fig.add_shape(
            type="rect",
            x0=x - box_half_width,
            y0=bottom_y,
            x1=x + box_half_width,
            y1=top_y,
            fillcolor=str(stage["color"]),
            line=dict(color="white", width=3),
        )

        fig.add_annotation(
            x=x,
            y=top_y - 0.25,
            text=f"<b>{stage['name']}</b>",
            showarrow=False,
            font=dict(size=label_font_size, family="Helvetica", color="white"),
        )

        # Bulleted items
        items: List[str] = list(stage.get("items", []))
        for i, item in enumerate(items):
            wrapped = _wrap_text(str(item), max_chars=16 if num >= 5 else 20)
            fig.add_annotation(
                x=x - (box_half_width - 0.15),
                y=top_y - 0.65 - (i * line_step),
                text=f"• {wrapped}",
                showarrow=False,
                font=dict(size=item_font_size, family="Helvetica", color="white"),
                align="left",
                xanchor="left",
            )

    # Arrows between boxes
    for i in range(len(positions) - 1):
        x_mid = (positions[i] + positions[i + 1]) / 2
        fig.add_annotation(
            x=x_mid,
            y=arrow_y,
            text="→",
            showarrow=False,
            font=dict(size=int(round(28 * scale)), family="Helvetica", color="#888"),
        )

    # Layout
    x_max = positions[-1] + (box_half_width + 0.9)
    fig.update_layout(
        title=dict(text=title, font=TITLE_FONT, x=0.5, xanchor="center"),
        xaxis=dict(range=[0, x_max], showgrid=False, showticklabels=False, zeroline=False, visible=False),
        yaxis=dict(range=[0, top_y + 0.3], showgrid=False, showticklabels=False, zeroline=False, visible=False),
        plot_bgcolor="white",
        paper_bgcolor="white",
        height=int(round(220 * scale)),
        margin=dict(t=45, b=10, l=10, r=10),
    )

    fig.write_image(outfile)


def render_simple_flow_diagram(
    stages: List[Dict[str, str]],
    title: str,
    outfile: str,
) -> None:
    """
    Simple text-based flow with larger boxes and better spacing.
    Each stage is just: name + single description line.

    Use this when you have longer text that needs to fit cleanly.

    Example:
        stages = [
            {'name': 'Input', 'description': 'Raw coordinates', 'color': '#64b5f6'},
            {'name': 'Process', 'description': 'Feature extraction', 'color': '#4db6ac'},
        ]
    """
    num = len(stages)
    box_width = 1.8
    box_height = 0.8
    spacing = 2.8

    fig = go.Figure()
    positions = [1.5 + i * spacing for i in range(num)]

    for stage, x in zip(stages, positions):
        fig.add_shape(
            type="rect",
            x0=x - box_width/2,
            y0=0.3,
            x1=x + box_width/2,
            y1=0.3 + box_height,
            fillcolor=str(stage["color"]),
            line=dict(color="white", width=3),
        )

        fig.add_annotation(
            x=x, y=0.85,
            text=f"<b>{stage['name']}</b>",
            showarrow=False,
            font=dict(size=13, family="Helvetica", color="white"),
        )

        fig.add_annotation(
            x=x, y=0.50,
            text=stage.get('description', ''),
            showarrow=False,
            font=dict(size=10, family="Helvetica", color="white"),
        )

    # Arrows
    for i in range(len(positions) - 1):
        x_mid = (positions[i] + positions[i + 1]) / 2
        fig.add_annotation(
            x=x_mid, y=0.7,
            text="→",
            showarrow=False,
            font=dict(size=32, family="Helvetica", color="#888"),
        )

    x_max = positions[-1] + box_width/2 + 0.5
    fig.update_layout(
        title=dict(text=title, font=dict(size=13, family="Helvetica", color="#2c3e50"), x=0.5, xanchor="center"),
        xaxis=dict(range=[0, x_max], showgrid=False, showticklabels=False, zeroline=False, visible=False),
        yaxis=dict(range=[0, 1.5], showgrid=False, showticklabels=False, zeroline=False, visible=False),
        plot_bgcolor="white",
        paper_bgcolor="white",
        height=180,
        margin=dict(t=45, b=10, l=10, r=10),
    )

    fig.write_image(outfile)


def render_network_diagram(
    nodes: List[Dict[str, object]],
    connections: List[Dict[str, str]],
    title: str,
    outfile: str,
    *,
    height: int = 350,
    label_offset: float = 0.26,
    label_font_size: int = 10,
) -> None:
    """
    Render network/agentic flow diagrams with nodes and labeled connections.
    Perfect for: multi-agent systems, methodology flows, collaboration patterns.

    Args:
        nodes: List of node dicts with 'id', 'name', 'x', 'y', 'color', optional 'size'
        connections: List of connection dicts with 'from', 'to', optional 'label', 'style'
        title: Diagram title
        outfile: SVG output path

    Example:
        nodes = [
            {'id': 'wildfire', 'name': 'Wildfire Agents', 'x': 1, 'y': 3, 'color': '#ef5350'},
            {'id': 'flood', 'name': 'Flood Agents', 'x': 3, 'y': 3, 'color': '#64b5f6'},
            {'id': 'coord', 'name': 'Coordinator', 'x': 2, 'y': 1, 'color': '#66bb6a'},
        ]
        connections = [
            {'from': 'wildfire', 'to': 'coord', 'label': 'risk scores'},
            {'from': 'flood', 'to': 'coord', 'label': 'risk scores'},
        ]
    """
    fig = go.Figure()
    node_map = {str(n['id']): n for n in nodes}
    pending_labels = []

    # Draw connections first
    for conn in connections:
        from_node = node_map.get(str(conn['from']))
        to_node = node_map.get(str(conn['to']))

        if not from_node or not to_node:
            continue

        from_x, from_y = float(from_node['x']), float(from_node['y'])
        to_x, to_y = float(to_node['x']), float(to_node['y'])

        from_size = float(from_node.get('size', 0.5))
        to_size = float(to_node.get('size', 0.5))
        box_height = 0.3

        dx = to_x - from_x
        dy = to_y - from_y
        dist = (dx**2 + dy**2)**0.5

        if dist > 0:
            dx_norm = dx / dist
            dy_norm = dy / dist

            inf = 1e9
            t_from_x = (from_size / abs(dx_norm)) if abs(dx_norm) > 1e-9 else inf
            t_from_y = (box_height / abs(dy_norm)) if abs(dy_norm) > 1e-9 else inf
            t_from = min(t_from_x, t_from_y)

            t_to_x = (to_size / abs(dx_norm)) if abs(dx_norm) > 1e-9 else inf
            t_to_y = (box_height / abs(dy_norm)) if abs(dy_norm) > 1e-9 else inf
            t_to = min(t_to_x, t_to_y)

            from_edge_x = from_x + (t_from + 0.03) * dx_norm
            from_edge_y = from_y + (t_from + 0.03) * dy_norm
            to_edge_x = to_x - (t_to + 0.03) * dx_norm
            to_edge_y = to_y - (t_to + 0.03) * dy_norm
        else:
            from_edge_x, from_edge_y = from_x, from_y
            to_edge_x, to_edge_y = to_x, to_y

        fig.add_annotation(
            x=to_edge_x, y=to_edge_y,
            ax=from_edge_x, ay=from_edge_y,
            xref="x", yref="y", axref="x", ayref="y",
            showarrow=True, arrowhead=2, arrowsize=1.2,
            arrowwidth=2.5, arrowcolor="#888", opacity=0.7,
        )

        # Add label
        label = conn.get('label', '')
        if label:
            mid_x = (from_edge_x + to_edge_x) / 2
            mid_y = (from_edge_y + to_edge_y) / 2

            ndx, ndy = to_edge_x - from_edge_x, to_edge_y - from_edge_y
            ndist = (ndx**2 + ndy**2)**0.5
            if ndist > 0:
                nx, ny = (-ndy / ndist, ndx / ndist)
            else:
                nx, ny = (0.0, 1.0)

            sign = 1 if ny >= 0 else -1
            mid_x += nx * label_offset * sign
            mid_y += ny * label_offset * sign

            pending_labels.append(dict(
                x=mid_x, y=mid_y,
                text=f"<i>{label}</i>",
                showarrow=False,
                font=dict(size=label_font_size, family="Helvetica", color="#333"),
                bgcolor="rgba(255,255,255,1.0)",
                bordercolor="#bbb", borderwidth=1, borderpad=4,
            ))

    # Draw nodes
    for node in nodes:
        x, y = float(node['x']), float(node['y'])
        size = float(node.get('size', 0.5))
        color = str(node['color'])

        fig.add_shape(
            type="rect",
            x0=x - size, y0=y - 0.3,
            x1=x + size, y1=y + 0.3,
            fillcolor=color,
            line=dict(color="white", width=2),
        )

        fig.add_annotation(
            x=x, y=y,
            text=f"<b>{node['name']}</b>",
            showarrow=False,
            font=dict(size=11, family="Helvetica", color="white"),
        )

    # Add labels after nodes
    for ann in pending_labels:
        fig.add_annotation(**ann)

    # Calculate bounds
    xs = [float(n['x']) for n in nodes]
    ys = [float(n['y']) for n in nodes]
    x_range = [min(xs) - 1.5, max(xs) + 1.5]
    y_range = [min(ys) - 0.8, max(ys) + 0.8]

    fig.update_layout(
        title=dict(text=title, font=TITLE_FONT, x=0.5, xanchor="center"),
        xaxis=dict(range=x_range, showgrid=False, showticklabels=False, zeroline=False, visible=False),
        yaxis=dict(range=y_range, showgrid=False, showticklabels=False, zeroline=False, visible=False),
        plot_bgcolor="white",
        paper_bgcolor="white",
        height=height,
        margin=dict(t=45, b=10, l=10, r=10),
    )

    fig.write_image(outfile)


def render_agent_cluster_diagram(
    clusters: List[Dict[str, object]],
    title: str,
    outfile: str,
    *,
    height: int = 400,
) -> None:
    """
    Render a multi-agent cluster diagram showing agent pools and their specializations.

    Each cluster dict should include:
        'name': str - Cluster name (e.g., "Wildfire Agents")
        'agents': List[str] - List of agent types
        'color': str - Hex color
        'x': float - X position
        'y': float - Y position

    Example:
        clusters = [
            {'name': 'Wildfire (32)', 'agents': ['Fuel', 'Weather', 'Terrain', 'Suppression'],
             'color': '#ef5350', 'x': 1, 'y': 2},
            {'name': 'Flood (32)', 'agents': ['Hydrology', 'Precipitation', 'Infrastructure', 'Coastal'],
             'color': '#64b5f6', 'x': 3, 'y': 2},
        ]
    """
    fig = go.Figure()

    for cluster in clusters:
        x, y = float(cluster['x']), float(cluster['y'])
        color = str(cluster['color'])
        agents = list(cluster.get('agents', []))

        # Main cluster box
        box_width = 1.2
        box_height = 0.4 + len(agents) * 0.25

        fig.add_shape(
            type="rect",
            x0=x - box_width, y0=y - box_height/2,
            x1=x + box_width, y1=y + box_height/2,
            fillcolor=color,
            line=dict(color="white", width=2),
            opacity=0.9,
        )

        # Cluster name
        fig.add_annotation(
            x=x, y=y + box_height/2 - 0.18,
            text=f"<b>{cluster['name']}</b>",
            showarrow=False,
            font=dict(size=12, family="Helvetica", color="white"),
        )

        # Agent list
        for i, agent in enumerate(agents):
            fig.add_annotation(
                x=x - box_width + 0.15,
                y=y + box_height/2 - 0.45 - i * 0.22,
                text=f"• {agent}",
                showarrow=False,
                font=dict(size=10, family="Helvetica", color="white"),
                xanchor="left",
            )

    # Calculate bounds
    xs = [float(c['x']) for c in clusters]
    ys = [float(c['y']) for c in clusters]
    x_range = [min(xs) - 2, max(xs) + 2]
    y_range = [min(ys) - 1.5, max(ys) + 1.5]

    fig.update_layout(
        title=dict(text=title, font=TITLE_FONT, x=0.5, xanchor="center"),
        xaxis=dict(range=x_range, showgrid=False, showticklabels=False, zeroline=False, visible=False),
        yaxis=dict(range=y_range, showgrid=False, showticklabels=False, zeroline=False, visible=False),
        plot_bgcolor="white",
        paper_bgcolor="white",
        height=height,
        margin=dict(t=45, b=10, l=10, r=10),
    )

    fig.write_image(outfile)

