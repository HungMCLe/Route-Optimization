# Route-Optimization
Route optimization project using Graph Neural Networks (GNN) for efficient planning. Optimizes routes across truck, rail, and ocean transport, minimizing cost, time, GHG emissions, and fuel usage.

```mermaid
flowchart TD
    %% Main Data Input Nodes
    InputData[/"Supply Chain Network Data"/]:::inputNode
    TransportData[/"Transportation Data"/]:::inputNode
    ConstraintData[/"Constraint Parameters"/]:::inputNode
    
    %% Input Data Breakdown - Network
    InputData --> Vendors["Vendors (Multiple)"]:::detailNode
    InputData --> Plants["Production Plants (Multiple)"]:::detailNode
    InputData --> DistCenters["Distribution Centers"]:::detailNode
    InputData --> Customers["End Customers (Multiple Markets)"]:::detailNode
    
    %% Input Data Breakdown - Transportation
    TransportData --> TruckRoutes["Truck Routes & Capacity"]:::detailNode
    TransportData --> RailNetwork["Rail Networks & Schedules"]:::detailNode
    TransportData --> OceanLanes["Ocean Shipping Lanes"]:::detailNode
    TransportData --> Intermodal["Intermodal Transfer Points"]:::detailNode
    
    %% Input Data Breakdown - Constraints
    ConstraintData --> CapacityLimits["Capacity Limits"]:::detailNode
    ConstraintData --> TimeWindows["Delivery Time Windows"]:::detailNode
    ConstraintData --> GHGTargets["GHG Emission Targets"]:::detailNode
    ConstraintData --> BudgetConstraints["Budget Constraints"]:::detailNode
    ConstraintData --> ServiceLevels["Service Level Requirements"]:::detailNode
    
    %% Graph Construction Section
    GraphConstruction["Graph Construction Phase"]:::processNode
    
    InputData --> GraphConstruction
    TransportData --> GraphConstruction
    ConstraintData --> GraphConstruction
    
    GraphConstruction --> NodeDefinition["Node Definition:<br/>Vendors, Plants, DCs, Customers<br/>with Attributes"]:::graphNode
    GraphConstruction --> EdgeDefinition["Edge Definition:<br/>Transportation Links<br/>with Attributes"]:::graphNode
    
    NodeDefinition --> NodeAttributes["Node Attributes:<br/>- Capacity<br/>- Production Rates<br/>- Fixed Costs<br/>- Storage Capability"]:::attributeNode
    
    EdgeDefinition --> EdgeAttributes["Edge Attributes:<br/>- Distance<br/>- Transit Time<br/>- Transportation Cost<br/>- GHG Emissions<br/>- Mode (Truck/Rail/Ocean)<br/>- Reliability"]:::attributeNode
    
    NodeDefinition --> CompleteGraph["Complete Multi-Modal<br/>Supply Chain Graph"]:::graphNode
    EdgeDefinition --> CompleteGraph
    
    %% GNN Framework Section
    GNNFramework["GNN Optimization Framework"]:::processNode
    
    CompleteGraph --> GNNFramework
    
    GNNFramework --> NodeEmbedding["Node Embedding Layer:<br/>Convert location data to<br/>feature vectors"]:::gnnNode
    NodeEmbedding --> MessagePassing["Message Passing Layers:<br/>Share information between<br/>connected nodes"]:::gnnNode
    MessagePassing --> GraphAttention["Graph Attention Mechanism:<br/>Focus on critical connections<br/>in the network"]:::gnnNode
    GraphAttention --> PathScoring["Path Scoring Layer:<br/>Evaluate potential routes<br/>across the network"]:::gnnNode
    
    %% Multi-Objective Optimization Section
    MultiObjective["Multi-Objective<br/>Optimization Engine"]:::processNode
    
    PathScoring --> MultiObjective
    
    MultiObjective --> CostMinimization["Cost Minimization:<br/>- Transportation Costs<br/>- Facility Costs<br/>- Inventory Costs"]:::objectiveNode
    MultiObjective --> GHGReduction["GHG Emission Reduction:<br/>- Mode Selection<br/>- Distance Optimization<br/>- Load Optimization"]:::objectiveNode
    MultiObjective --> ServiceMaximization["Service Level Maximization:<br/>- On-Time Delivery<br/>- Order Fulfillment Rate<br/>- Lead Time"]:::objectiveNode
    
    CostMinimization --> ParetoFrontier["Pareto Frontier of<br/>Optimal Solutions"]:::resultNode
    GHGReduction --> ParetoFrontier
    ServiceMaximization --> ParetoFrontier
    
    %% Route Recommendation Section
    RouteEngine["Route Recommendation<br/>Engine"]:::processNode
    
    ParetoFrontier --> RouteEngine
    
    RouteEngine --> ModeSelection["Optimal Mode Selection:<br/>Truck/Rail/Ocean for each segment"]:::outputNode
    RouteEngine --> VendorAssignment["Vendor-Plant Assignments:<br/>Optimal sourcing strategy"]:::outputNode
    RouteEngine --> FlowOptimization["End-to-End Flow Optimization:<br/>Plant-DC-Customer routes"]:::outputNode
    RouteEngine --> LoadPlanning["Load Planning & Consolidation:<br/>Maximize utilization"]:::outputNode
    
    %% Implementation & Monitoring
    Implementation["Implementation &<br/>Continuous Optimization"]:::processNode
    
    ModeSelection --> Implementation
    VendorAssignment --> Implementation
    FlowOptimization --> Implementation
    LoadPlanning --> Implementation
    
    Implementation --> RealTimeTracking["Real-Time Tracking &<br/>Route Adjustments"]:::monitorNode
    Implementation --> PerformanceMetrics["KPI Monitoring:<br/>Cost, GHG, Service Level"]:::monitorNode
    Implementation --> ModelRefinement["GNN Model Refinement<br/>with New Data"]:::monitorNode
    
    %% Feedback Loop
    ModelRefinement --> GraphConstruction
    
    %% Styling
    classDef inputNode fill:#d4f1f9,stroke:#05a8e6,stroke-width:2px,color:black,font-weight:bold
    classDef detailNode fill:#e1f5fe,stroke:#0288d1,stroke-width:1px
    classDef processNode fill:#fffde7,stroke:#fbc02d,stroke-width:3px,color:black,font-weight:bold
    classDef graphNode fill:#e8f5e9,stroke:#43a047,stroke-width:2px
    classDef attributeNode fill:#f1f8e9,stroke:#7cb342,stroke-width:1px
    classDef gnnNode fill:#e1d5e7,stroke:#9673a6,stroke-width:2px
    classDef objectiveNode fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px
    classDef resultNode fill:#d1c4e9,stroke:#5e35b1,stroke-width:2px,font-weight:bold
    classDef outputNode fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef monitorNode fill:#ffe0b2,stroke:#ef6c00,stroke-width:1px
```


