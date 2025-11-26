# BlazeBuilder Research Publications

This directory contains three peer-review-ready academic papers on geospatial AI for environmental risk assessment.

## Papers

### Paper 1: GeoAI Agentic Flow
**Subtitle**: A Novel Architecture for Spatial Intelligence in Environmental Risk Assessment

**Directory**: `geoai_agentic_flow/`

**Key Contributions**:
- Complete system architecture overview
- Mathematical foundations (Theorems 1-3)
- 4-stage Coordinate Embedding Framework
- Multi-agent coordination protocol
- Real-world use case: Sonoma County Tubbs Fire (2017)

### Paper 2: Coordinate Embedding Framework
**Subtitle**: Theoretical Foundations for Geospatial Vector Representations

**Directory**: `coordinate_embedding/`

**Key Contributions**:
- Formal embedding theory (Definition 1)
- Bi-Lipschitz property proof (Theorem 4)
- Feature fidelity bounds (Theorem 5)
- Stage independence analysis (Lemma 1)
- Use case: Los Angeles County Fire Risk Embedding

### Paper 3: Multi-Agent Geospatial Coordination
**Subtitle**: Consensus Protocols for Distributed Environmental Risk Assessment

**Directory**: `multi_agent_coordination/`

**Key Contributions**:
- Weighted consensus optimality proof (Theorem 6)
- Byzantine fault tolerance analysis (Theorem 7)
- Communication efficiency bounds (Theorem 8)
- 128-agent architecture with 4 specialized pools
- Use case: Paradise Camp Fire (2018)

## Building PDFs

Each paper uses Quarto for PDF generation. To build:

```bash
# Build Paper 1
cd geoai_agentic_flow
quarto render

# Build Paper 2
cd ../coordinate_embedding
quarto render

# Build Paper 3
cd ../multi_agent_coordination
quarto render
```

PDFs are output to the `pdf/` directory.

## Requirements

- Quarto >= 1.4
- Python 3.10+ (for visualizations)
- LaTeX distribution (TinyTeX or TeXLive)

Install Quarto:
```bash
# macOS
brew install quarto

# Or download from https://quarto.org/docs/get-started/
```

Install TinyTeX (minimal LaTeX):
```bash
quarto install tinytex
```

## File Structure

```
publications/
├── _diagram_style.py           # Plotly visualization helpers
├── README.md                   # This file
├── geoai_agentic_flow/
│   ├── _quarto.yml             # Quarto configuration
│   ├── index.qmd               # Abstract
│   ├── 1_introduction.qmd      # Introduction
│   ├── 2_mathematical_foundations.qmd  # Theorems 1-3
│   ├── 3_coordinate_embedding.qmd
│   ├── 4_spatial_neural_network.qmd
│   ├── 5_multi_agent_system.qmd
│   ├── 6_experiments.qmd
│   ├── 7_results.qmd
│   ├── 8_conclusion.qmd
│   ├── 9_appendix.qmd
│   ├── 10_use_case.qmd         # Tubbs Fire scenario
│   └── references.bib
├── coordinate_embedding/
│   ├── _quarto.yml
│   ├── index.qmd
│   ├── 1_introduction.qmd
│   ├── 2_embedding_theory.qmd
│   ├── 3_distance_preservation.qmd  # Theorems 4-5, Lemma 1
│   ├── 4_implementation.qmd
│   ├── 5_experiments.qmd
│   ├── 6_conclusion.qmd
│   ├── 7_use_case.qmd          # LA County embedding
│   └── references.bib
├── multi_agent_coordination/
│   ├── _quarto.yml
│   ├── index.qmd
│   ├── 1_introduction.qmd
│   ├── 2_coordination_theory.qmd
│   ├── 3_consensus_proofs.qmd   # Theorems 6-8
│   ├── 4_agent_specialization.qmd
│   ├── 5_experiments.qmd
│   ├── 6_conclusion.qmd
│   ├── 7_use_case.qmd          # Camp Fire scenario
│   └── references.bib
└── pdf/                        # Generated PDFs
```

## Mathematical Content

### Theorem Summary

| Paper | Theorem | Statement |
|-------|---------|-----------|
| 1 | Theorem 1 | Coordinate Embedding Continuity |
| 1 | Theorem 2 | Embedding Space Distance Preservation |
| 1 | Theorem 3 | Multi-Agent Consensus Convergence |
| 2 | Theorem 4 | Bi-Lipschitz Property |
| 2 | Theorem 5 | Feature Fidelity Bound |
| 2 | Lemma 1 | Stage Independence |
| 3 | Theorem 6 | Weighted Consensus Optimality |
| 3 | Theorem 7 | Fault Tolerance |
| 3 | Theorem 8 | Communication Efficiency |

### Key Results

- **89.7% accuracy** on California fire hazard classification
- **93.4% recall** on Very High risk addresses
- **15,847 addresses/second** processing throughput
- **Byzantine fault tolerance** up to n/3 failed agents
- **Validation against real fires**: Tubbs (2017), Camp (2018), Woolsey (2018)

## Citation

```bibtex
@article{chuba2025geoai,
  title={GeoAI Agentic Flow: A Novel Architecture for Spatial Intelligence in Environmental Risk Assessment},
  author={Chuba, Yevheniy},
  journal={BlazeBuilder Research Publications},
  year={2025},
  institution={University of Pittsburgh}
}
```

## License

Copyright © 2025 Yevheniy Chuba. All rights reserved.

---

*For questions or collaboration inquiries: yec64@pitt.edu*

