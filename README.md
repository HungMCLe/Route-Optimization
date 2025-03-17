# Route-Optimization
Route optimization project using Graph Neural Networks (GNN) for efficient planning. Optimizes routes across truck, rail, and ocean transport, minimizing cost, time, GHG emissions, and fuel usage.

```mermaid
graph TD
    A[Input Data: Locations, Costs, Emissions, Transport Modes] --> B[Graph Construction]
    B --> C[GNN Model: Learn optimal patterns]
    C --> D[A* Algorithm: Find shortest/cheapest paths]
    D --> E[Multi-Modal Optimization: Truck, Rail, Ocean]
    E --> F[Output: Optimized Routes, Costs, GHG Reduction]
    subgraph Frameworks
        G[PyTorch Geometric (GNN)]
        H[NetworkX (Graph/A*)]
        I[Custom Cost/GHG Functions]
    end
    G --> C
    H --> D
    I --> E
```
