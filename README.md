# Route-Optimization
Route optimization project using Graph Neural Networks (GNN) for efficient planning. Optimizes routes across truck, rail, and ocean transport, minimizing cost, time, GHG emissions, and fuel usage.

```mermaid
graph TD
    A[Input Data: Vendors, Plants, End Destinations, Transport Modes, Costs, Emissions] --> B[Graph Construction: Nodes & Edges]

    subgraph Nodes
        V1[Vendor 1]
        V2[Vendor 2]
        V3[Vendor 3]
        P1[Plant 1]
        P2[Plant 2]
        P3[Plant 3]
        D1[Destination 1]
        D2[Destination 2]
        D3[Destination 3]
    end

    B --> V1
    B --> V2
    B --> V3
    B --> P1
    B --> P2
    B --> P3
    B --> D1
    B --> D2
    B --> D3

    V1 & V2 & V3 & P1 & P2 & P3 & D1 & D2 & D3 --> C[GNN Model: Learn patterns (cost, time, GHG)]
    C --> D[A* Algorithm: Shortest/Best Path Search]
    D --> E[Multi-Modal Optimization: Truck, Rail, Ocean]
    E --> F[Output: Optimized Routes, Costs, Emissions]

    subgraph Frameworks
        G[PyTorch Geometric (GNN)]
        H[NetworkX (Graph & A*)]
        I[Custom Functions: Cost, Time, GHG]
    end

    G --> C
    H --> D
    I --> E
```

