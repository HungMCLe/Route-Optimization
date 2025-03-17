# Route-Optimization
Route optimization project using Graph Neural Networks (GNN) for efficient planning. Optimizes routes across truck, rail, and ocean transport, minimizing cost, time, GHG emissions, and fuel usage.

```mermaid
graph TD
    A[Input Data: Vendors, Plants, End Destinations, Transport Modes, Costs, Emissions] --> B[Graph Construction: Nodes & Edges]

    subgraph Vendors
        V1[Vendor 1]
        V2[Vendor 2]
        V3[Vendor 3]
    end

    subgraph Plants
        P1[Plant 1]
        P2[Plant 2]
        P3[Plant 3]
    end

    subgraph Destinations
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

    V1 --> C[GNN Model: Learn cost, time, GHG patterns]
    V2 --> C
    V3 --> C
    P1 --> C
    P2 --> C
    P3 --> C
    D1 --> C
    D2 --> C
    D3 --> C

    C --> D[A* Algorithm: Find shortest & optimal paths]
    D --> E[Multi-Modal Optimization: Truck, Rail, Ocean]
    E --> F[Output: Optimized Routes, Cost & GHG Reduction]

    subgraph Frameworks
        G[PyTorch Geometric (GNN)]
        H[NetworkX (Graph & A*)]
        I[Custom Cost/GHG Functions]
    end

    G --> C
    H --> D
    I --> E
```


